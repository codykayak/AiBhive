import { electricalPack } from './electrical';
import { poolPack } from './pool';
import type { TradePack, TradePackId } from './types';

export const TRADE_PACKS: Record<TradePackId, TradePack> = {
  pool: poolPack,
  electrical: electricalPack,
};

export const TRADE_PACK_LIST: TradePack[] = [poolPack, electricalPack];

export function getTradePack(id: TradePackId): TradePack {
  return TRADE_PACKS[id];
}

export function isTradePackId(value: string): value is TradePackId {
  return value === 'pool' || value === 'electrical';
}

export type { TradePack, TradePackId, DiagnosisCategory, ChatMessage, ChatAttachment, DiagnosisResult } from './types';
