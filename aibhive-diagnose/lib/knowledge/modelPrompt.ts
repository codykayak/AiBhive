import { detectEquipment } from './search';

/** Nameplate-style tokens: RU199, 24ACC636, WM3900HWA, SP3202VSP */
const MODEL_RE = /\b[A-Z][A-Z0-9/.-]{3,}\b|\b\d{3,}[A-Z][A-Z0-9]{2,}\b/;

export function hasModelToken(text: string): boolean {
  return MODEL_RE.test(text.trim());
}

export function shouldAskForModel(text: string): boolean {
  const q = text.trim();
  if (!q || q.length < 8) return false;
  const equip = detectEquipment(q);
  if (!equip.length) return false;
  return !hasModelToken(q);
}

export function modelPromptContent(): string {
  return [
    '**Quick tip — grab the model number**',
    '',
    'I can narrow this down faster with the **nameplate model** (photo the sticker if needed).',
    '',
    'Tap the **document icon** below or **Field tools → Equipment manuals** and search that model for the OEM install/service guide.',
  ].join('\n');
}
