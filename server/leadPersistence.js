const BUCKET_NAME = 'aibhive-media';

export async function persistLeadProcessingResult({
  leadRef,
  leadId,
  result,
  gcsStorage,
  userEmail,
  transporter,
  emailUser,
}) {
  if (!result.success) {
    await leadRef.update({
      status: 'failed',
      error: result.error,
      errorStack: result.errorStack || null,
      pipelineRun: result.pipelineRun || null,
      pipelineRetriedAt: new Date().toISOString(),
    });
    return { ok: false };
  }

  let gcsCleanTextUrl = null;
  let gcsAnnotatedTextUrl = null;
  let gcsAudioUrl = null;

  const urlOptions = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 72 * 60 * 60 * 1000,
  };

  try {
    const bucket = gcsStorage.bucket(BUCKET_NAME);
    const cleanTextFilename = `clean_output_${leadId}.txt`;
    const cleanTextFile = bucket.file(cleanTextFilename);
    await cleanTextFile.save(result.cleanTranslatedText, { contentType: 'text/plain' });
    const [cleanUrl] = await cleanTextFile.getSignedUrl(urlOptions);
    gcsCleanTextUrl = cleanUrl;

    const annotatedTextFilename = `annotated_output_${leadId}.txt`;
    const annotatedTextFile = bucket.file(annotatedTextFilename);
    await annotatedTextFile.save(result.annotatedText, { contentType: 'text/plain' });
    const [annotatedUrl] = await annotatedTextFile.getSignedUrl(urlOptions);
    gcsAnnotatedTextUrl = annotatedUrl;

    if (result.clonedAudioBuffer) {
      const audioFilename = `cloned_audio_${leadId}.mp3`;
      const audioFile = bucket.file(audioFilename);
      await audioFile.save(result.clonedAudioBuffer, { contentType: 'audio/mpeg' });
      const [audioUrl] = await audioFile.getSignedUrl(urlOptions);
      gcsAudioUrl = audioUrl;
    }
  } catch (storageError) {
    console.error('[leadPersistence] GCS save failed:', storageError);
  }

  await leadRef.update({
    status: 'completed',
    rawTranscript: result.originalText || null,
    finalOutputTextUrl: gcsAnnotatedTextUrl,
    cleanTranslatedTextUrl: gcsCleanTextUrl,
    annotatedTextUrl: gcsAnnotatedTextUrl,
    finalAudioUrl: gcsAudioUrl || null,
    voiceModelId: result.voiceModelId || null,
    translatedTitle: result.translatedTitle || null,
    translatedSummary: result.translatedSummary || null,
    flags: result.flags || [],
    ragCitations: result.ragCitations || [],
    pipelineRun: result.pipelineRun || null,
    error: null,
    errorStack: null,
    completedAt: new Date().toISOString(),
  });

  if (userEmail && transporter && emailUser) {
    let emailText = `Your Media files from AiBhive are complete.\n\n`;
    if (result.translatedTitle) emailText += `Title: ${result.translatedTitle}\n`;
    if (result.translatedSummary) emailText += `Summary: ${result.translatedSummary}\n\n`;
    emailText += `Download your files here (links expire in 72 hours):\n`;
    if (gcsCleanTextUrl) emailText += `Clean Text: ${gcsCleanTextUrl}\n`;
    if (gcsAnnotatedTextUrl) emailText += `Annotated Text: ${gcsAnnotatedTextUrl}\n`;
    if (gcsAudioUrl) emailText += `Cloned Audio: ${gcsAudioUrl}\n`;

    let emailHtml = `<h3>Your Media files from AiBhive are complete.</h3>`;
    if (result.translatedTitle) emailHtml += `<h4>${result.translatedTitle}</h4>`;
    if (result.translatedSummary) emailHtml += `<p><em>${result.translatedSummary}</em></p>`;
    emailHtml += `<p>Download your files (links expire in 72 hours):</p><ul>`;
    if (gcsCleanTextUrl) emailHtml += `<li><a href="${gcsCleanTextUrl}">Clean Text</a></li>`;
    if (gcsAnnotatedTextUrl) emailHtml += `<li><a href="${gcsAnnotatedTextUrl}">Annotated Text</a></li>`;
    if (gcsAudioUrl) emailHtml += `<li><a href="${gcsAudioUrl}">Cloned Audio</a></li>`;
    emailHtml += `</ul>`;

    try {
      await transporter.sendMail({
        from: emailUser,
        to: userEmail,
        subject: 'Your AiBhive Files are Ready!',
        text: emailText,
        html: emailHtml,
      });
    } catch (mailErr) {
      console.error('[leadPersistence] Email failed:', mailErr);
    }
  }

  return { ok: true, gcsCleanTextUrl, gcsAnnotatedTextUrl, gcsAudioUrl };
}

export async function fetchTextFromUrl(url) {
  const axios = (await import('axios')).default;
  const res = await axios.get(url, { responseType: 'text', timeout: 30000 });
  return res.data;
}
