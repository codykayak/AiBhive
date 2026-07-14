import type { TradePackId } from './types';

/** Signed-in field users get every trade pack library — not just their roster default. */
export function hasFullPackLibraryAccess(signedIn: boolean): boolean {
  return signedIn;
}

/** When full access is on, omit pack filter so search spans all trade libraries. */
export function resolveSearchPackId(
  activePackId: TradePackId,
  signedIn: boolean
): TradePackId | undefined {
  return hasFullPackLibraryAccess(signedIn) ? undefined : activePackId;
}
