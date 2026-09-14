/** Opens the floating Pros voice panel on marketing pages. */
export const PROS_VOICE_OPEN_EVENT = 'aibhive-pros-voice-open';

export function openProsVoicePanel(options?: { startCall?: boolean }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(PROS_VOICE_OPEN_EVENT, { detail: { startCall: Boolean(options?.startCall) } }),
  );
}
