import { electricalPack } from './electrical';
import { hvacPack } from './hvac';
import { plumbingPack } from './plumbing';
import { poolPack } from './pool';
import { propertyPack } from './property';
import type { TradePack, TradePackId } from './types';

export const TRADE_PACKS: Record<TradePackId, TradePack> = {
  pool: poolPack,
  electrical: electricalPack,
  property: propertyPack,
  plumbing: plumbingPack,
  hvac: hvacPack,
};

export const TRADE_PACK_LIST: TradePack[] = [
  poolPack,
  electricalPack,
  propertyPack,
  plumbingPack,
  hvacPack,
];

export function getTradePack(id: TradePackId): TradePack {
  return TRADE_PACKS[id];
}

export function isTradePackId(value: string): value is TradePackId {
  return (
    value === 'pool' ||
    value === 'electrical' ||
    value === 'property' ||
    value === 'plumbing' ||
    value === 'hvac'
  );
}

export type { TradePack, TradePackId, DiagnosisCategory, ChatMessage, ChatAttachment, DiagnosisResult } from './types';
