const ALLOWED_MODELS = ['gemini', 'claude', 'grok'];

export function normalizeVerificationModels(models) {
  if (!Array.isArray(models)) return ['gemini'];
  const filtered = [...new Set(models.map((m) => String(m).toLowerCase()).filter((m) => ALLOWED_MODELS.includes(m)))];
  return filtered.length > 0 ? filtered : ['gemini'];
}

export async function getPipelineSettings(db) {
  const doc = await db.collection('system').doc('settings').get();
  const data = doc.exists ? doc.data() : {};
  const verificationModels = normalizeVerificationModels(
    data.verificationModels?.length
      ? data.verificationModels
      : data.preferredModel
        ? [data.preferredModel]
        : ['gemini']
  );
  return { verificationModels };
}
