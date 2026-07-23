const MAX_VISION_ATTACHMENTS = 6;

function normalizeVisionAttachments(attachment, attachments) {
  const list = [];
  if (attachment?.base64) list.push(attachment);
  if (Array.isArray(attachments)) list.push(...attachments);
  return list
    .filter((a) => a?.base64)
    .slice(0, MAX_VISION_ATTACHMENTS)
    .map((a) => {
      const rawMime = String(a.mimeType || 'image/jpeg').toLowerCase();
      const mime = rawMime.includes('png') ? 'image/png' : 'image/jpeg';
      const base64 = String(a.base64).replace(/^data:[^;]+;base64,/, '');
      return { mime, base64 };
    })
    .filter((a) => a.base64.length >= 80);
}

/** xAI expects plain string user content unless images are attached. */
export function buildGrokUserContent(userText, attachment = null, attachments = null) {
  const text = String(userText || 'Help me on this job.').slice(0, 4000);
  const images = normalizeVisionAttachments(attachment, attachments);
  if (!images.length) return text;

  const parts = images.map((img) => ({
    type: 'image_url',
    image_url: {
      url: `data:${img.mime};base64,${img.base64}`,
      detail: 'high',
    },
  }));

  const labeledText =
    images.length > 1
      ? `${text}\n\n[${images.length} field photos attached — analyze ALL images together; cross-reference traits across angles before assigning confidence.]`
      : text;

  return [...parts, { type: 'text', text: labeledText }];
}

export { MAX_VISION_ATTACHMENTS };
