import { marketById } from './assumptions';
import { money, multiple, pct, psf } from './format';
import type { Deal, Underwriting } from './types';

export function memoText(deal: Deal, u: Underwriting): string {
  const sf = deal.rentableSf || 1;
  const lines = [
    `AI BHIVE BID DESK — ${deal.jobCode}`,
    deal.name,
    deal.address,
    `Phase ${deal.phase} · ${deal.strategy.replace('-', ' ')} · ${marketById(deal.marketId).name}`,
    '',
    `Recommendation: ${u.verdict} (score ${u.score})`,
    ...u.reasons.map((reason) => `- ${reason}`),
    '',
    `Asking price: ${money(deal.askingPrice)} (${psf(deal.askingPrice / sf)})`,
    `Draft bid: ${money(deal.purchasePrice)} (${psf(deal.purchasePrice / sf)})`,
    `Ceiling from ${u.binding ?? 'the model'}: ${money(u.maxBid)}`,
    `Total basis: ${money(u.totalCost)} · Equity: ${money(u.equity)} · Senior: ${money(u.senior)}`,
    '',
    deal.strategy === 'ground-up'
      ? `Stabilized NOI: ${money(u.stabilized.noi)} · Yield on cost: ${pct(u.yieldOnCost)} · Spread vs exit: ${u.spreadBps != null ? `${Math.round(u.spreadBps)} bps` : '—'}`
      : `Stabilized NOI: ${money(u.stabilized.noi)} · Cap rate: ${pct(u.stabilizedCap)} · Yield on cost: ${pct(u.yieldOnCost)}`,
    `Year-1 cash-on-cash: ${pct(u.cashOnCash)} · Takeout DSCR: ${multiple(u.dscr)} · Debt yield: ${pct(u.debtYield)}`,
    `DSCR if rates rise 100 bps: ${multiple(u.rateShockDscr)}`,
    `Levered IRR: ${pct(u.irr)} · Equity multiple: ${multiple(u.equityMultiple)}`,
    '',
    `Owner hard cost: ${money(u.ownerHard)} (${psf(u.hardPerSf)})`,
    `Contractor bid before owner contingency: ${money(u.contractorBid)}`,
    `Labor ${money(u.labor)} · Materials ${money(u.materials)} · Equipment ${money(u.equipment)} · Waste ${money(u.wasteDollars)} · Material tax ${money(u.materialTax)}`,
    '',
    'Uses',
    ...u.uses.map((item) => `- ${item.label}: ${money(item.amount)}`),
    '',
    'This is a planning desk for an investment committee. It is not an appraisal, a loan commitment, or a GMP. Trade names shipped with the sample jobs are illustrative until a live quote is selected.',
    deal.notes,
  ];
  return lines.join('\n');
}
