/** xAI expects plain string user content unless images are attached. */
export function buildGrokUserContent(userText, attachment = null) {
  const text = String(userText || 'Help me on this job.').slice(0, 4000);
  if (!attachment?.base64) return text;

  const rawMime = String(attachment.mimeType || 'image/jpeg').toLowerCase();
  const mime = rawMime.includes('png') ? 'image/png' : 'image/jpeg';
  const base64 = String(attachment.base64).replace(/^data:[^;]+;base64,/, '');

  return [
    {
      type: 'image_url',
      image_url: {
        url: `data:${mime};base64,${base64}`,
        detail: 'high',
      },
    },
    { type: 'text', text },
  ];
}
