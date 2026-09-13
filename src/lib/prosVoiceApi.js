const apiBase = import.meta.env.VITE_API_URL ?? '';

/**
 * Mint a short-lived xAI Voice Agent token for Pros (public demo line).
 * The platform XAI_API_KEY never leaves the server.
 */
export async function createProsVoiceSession() {
  const res = await fetch(`${apiBase}/api/pros/voice/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).catch((e) => {
    throw new Error(
      e?.message === 'Failed to fetch'
        ? 'Could not reach the Pros voice service. Try again in a moment or call the phone line.'
        : e.message || 'Could not start a voice session.',
    );
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Voice session failed (${res.status})`);
  }
  if (!data.value) {
    throw new Error('Voice session did not return a token.');
  }
  return data;
}

export async function fetchProsVoiceContact() {
  const res = await fetch(`${apiBase}/api/pros/voice/contact`);
  if (!res.ok) return null;
  return res.json().catch(() => null);
}
