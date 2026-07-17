import type { TradePackId } from '@/lib/packs/types';

export type EquipmentManual = {
  id: string;
  packId: TradePackId;
  brand: string;
  /** Searchable model numbers and family prefixes (e.g. WH, 011057, RU199). */
  modelPrefixes: string[];
  title: string;
  category: string;
  /** OEM install / service / user manual page (opens in browser). */
  manualUrl: string;
  /** Optional preview image URL (manufacturer asset or schematic). */
  thumbnailUrl?: string;
  summary: string;
  relatedFaultIds?: string[];
};
