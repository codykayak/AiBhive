/** xAI expects plain string user content unless images are attached. */
export function buildGrokUserContent(userText, attachment = null) {
  const text = String(userText || 'Help me on this job.').slice(0, 4000);
  if (!attachment?.base64) return text;

  const mime = attachment.mimeType || 'image/jpeg';
  return [
    { type: 'text', text },
    {
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${attachment.base64}` },
    },
  ];
}
