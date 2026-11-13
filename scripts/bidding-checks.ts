import { stackMultiplier } from '../src/lib/bidding/assumptions';
import { irr, monthlyPayment, portfolioRollup, underwrite } from '../src/lib/bidding/engine';
import { PRESETS } from '../src/lib/bidding/presets';
import { money, pct, multiple } from '../src/lib/bidding/format';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const payment = monthlyPayment(1_000_000, 0.06, 30);
assert(Math.abs(payment - 5995.51) < 0.2, `mortgage payment ${payment}`);

const rate = irr([-100, 110]);
assert(rate != null && Math.abs(rate - 0.1) < 0.002, `irr ${rate}`);

const books = PRESETS.map((deal) => ({ deal, u: underwrite(deal) }));
const roll = portfolioRollup(books);
assert(roll.totalCost > 1_000_000_000, `pipeline basis ${roll.totalCost} is under $1B`);

for (const book of books) {
  const { deal, u } = book;
  assert(Number.isFinite(u.stabilized.noi), `${deal.id} NOI`);
  assert(Number.isFinite(u.totalCost) && u.totalCost > 0, `${deal.id} basis`);
  assert(u.ownerHard > 0, `${deal.id} hard cost`);
  assert(!u.lines.some((line) => !Number.isFinite(line.total)), `${deal.id} trade NaN`);
  const ceiling = u.constraints.find((item) => item.required && item.price != null && item.label === u.binding);
  if (ceiling?.price) {
    const atCeiling = underwrite({ ...deal, purchasePrice: ceiling.price });
    const rule = atCeiling.constraints.find((item) => item.label === ceiling.label);
    assert(rule?.pass || (rule?.value != null && rule.value >= rule.target * 0.98), `${deal.id} ceiling ${ceiling.label} ${rule?.value} vs ${rule?.target}`);
  }
  console.log(
    [
      deal.id,
      u.verdict,
      `basis ${money(u.totalCost)}`,
      `bid ${money(deal.purchasePrice)}`,
      `ceiling ${money(u.maxBid)} (${u.binding})`,
      `NOI ${money(u.stabilized.noi)}`,
      `cap ${pct(u.stabilizedCap)}`,
      `yoc ${pct(u.yieldOnCost)}`,
      `coc ${pct(u.cashOnCash)}`,
      `dscr ${multiple(u.dscr)}`,
      `dy ${pct(u.debtYield)}`,
      `hard ${u.hardPerSf.toFixed(2)}/sf`,
      `irr ${pct(u.irr)}`,
    ].join(' | '),
  );
  if (u.warnings.length) console.log('  warnings:', u.warnings.join(' · '));
}

console.log('PIPELINE', money(roll.totalCost), 'equity', money(roll.equity), 'NOI', money(roll.noi), 'CoC', pct(roll.cashOnCash));
console.log('stack', stackMultiplier(PRESETS[0].gc).toFixed(4));
console.log('bidding checks passed');
