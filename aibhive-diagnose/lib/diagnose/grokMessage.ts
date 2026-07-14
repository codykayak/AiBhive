/** xAI expects plain string user content unless images are attached. */
export function buildGrokUserContent(
  userText: string,
  attachment?: { base64?: string; mimeType?: string } | null
): string | Array<Record<string, unknown>> {
  const text = String(userText || 'Help me on this job.').slice(0, 4000);
  if (!attachment?.base64) return text;

  return [
    { type: 'text', text },
    {
      type: 'image_url',
      image_url: {
        url: `data:${attachment.mimeType || 'image/jpeg'};base64,${attachment.base64}`,
      },
    },
  ];
}
