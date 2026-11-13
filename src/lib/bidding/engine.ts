import { marketById, qualityFactor } from './assumptions';
import type {
  CashYear,
  ConstraintResult,
  Deal,
  ExpenseLine,
  IncomeLine,
  Ops,
  SensitivityCell,
  StackStep,
  TradeLine,
  Underwriting,
} from './types';

export interface ComputeOpts {
  rentScale?: number;
  hardScale?: number;
  rateAdd?: number;
}

export function monthlyPayment(principal: number, annualRate: number, amortYears: number): number {
  if (!(principal > 0)) return 0;
  const n = Math.max(1, Math.round((amortYears || 1) * 12));
  const r = annualRate / 12;
  if (!(r > 0)) return principal / n;
  const pow = (1 + r) ** n;
  return (principal * r * pow) / (pow - 1);
}

export function loanBalance(
  principal: number,
  annualRate: number,
  amortYears: number,
  ioYears: number,
  holdYears: number,
): number {
  if (!(principal > 0)) return 0;
  const amortMonths = Math.max(0, Math.round((holdYears - ioYears) * 12));
  if (amortMonths <= 0) return principal;
  const r = annualRate / 12;
  const pmt = monthlyPayment(principal, annualRate, amortYears);
  if (!(r > 0)) return Math.max(0, principal - pmt * amortMonths);
  const pow = (1 + r) ** amortMonths;
  return Math.max(0, principal * pow - (pmt * (pow - 1)) / r);
}

export function irr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;
  let rate = 0.1;
  for (let i = 0; i < 60; i += 1) {
    let npv = 0;
    let deriv = 0;
    for (let t = 0; t < cashFlows.length; t += 1) {
      const den = (1 + rate) ** t;
      npv += cashFlows[t] / den;
      if (t > 0) deriv -= (t * cashFlows[t]) / (1 + rate) ** (t + 1);
    }
    if (Math.abs(npv) < 1e-4) return rate;
    if (!Number.isFinite(deriv) || Math.abs(deriv) < 1e-10) break;
    rate -= npv / deriv;
    if (rate <= -0.9) rate = -0.5;
    if (rate > 5) return null;
  }
  return Number.isFinite(rate) && rate > -0.9 && rate < 5 ? rate : null;
}

function finite(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, finite(n, min)));
}

function incomeAmount(line: IncomeLine, sf: number, units: number, scale: number): number {
  const amount = finite(line.amount) * scale;
  if (line.basis === 'sf') return amount * sf;
  if (line.basis === 'unit') return amount * units;
  return amount;
}

function expenseAmount(
  line: ExpenseLine,
  ctx: { sf: number; units: number; egi: number; price: number; cost: number },
): number {
  const amount = finite(line.amount);
  if (line.basis === 'sf') return amount * ctx.sf;
  if (line.basis === 'unit') return amount * ctx.units;
  if (line.basis === 'egi') return amount * ctx.egi;
  if (line.basis === 'price') return amount * ctx.price;
  if (line.basis === 'cost') return amount * ctx.cost;
  return amount;
}

function buildOps(
  deal: Deal,
  mode: 'stabilized' | 'in-place',
  totalCost: number,
  rentScale: number,
): Ops {
  const sf = Math.max(0, finite(deal.rentableSf));
  const units = Math.max(0, finite(deal.units));
  const price = Math.max(0, finite(deal.purchasePrice));
  let gpr = 0;
  let other = 0;
  if (mode === 'stabilized') {
    for (const line of deal.income) {
      const dollars = incomeAmount(line, sf, units, rentScale);
      if (/other|parking|laundry|pet|antenna|recover/i.test(line.label) && line !== deal.income[0]) {
        other += dollars;
      } else {
        gpr += dollars;
      }
    }
  } else {
    gpr = finite(deal.inPlaceRent) * rentScale * (deal.rentBasis === 'unit' ? units : sf);
    other = finite(deal.inPlaceOther) * rentScale;
  }
  if (mode === 'in-place' && gpr <= 0 && other <= 0) {
    return {
      gpr: 0,
      vacancyLoss: 0,
      creditLoss: 0,
      otherIncome: 0,
      egi: 0,
      expenses: [],
      opex: 0,
      noi: 0,
      reserves: 0,
      cashFlowBeforeDebt: 0,
    };
  }
  const vacancy = clamp(mode === 'stabilized' ? deal.vacancy : deal.inPlaceVacancy, 0, 0.85);
  const credit = clamp(deal.creditLoss, 0, 0.2);
  const vacancyLoss = gpr * vacancy;
  const creditLoss = gpr * credit;
  const egi = gpr - vacancyLoss - creditLoss + other;
  const ctx = { sf, units, egi, price, cost: totalCost };
  const expenses = deal.expenses.map((line) => ({
    label: line.label,
    amount: expenseAmount(line, ctx),
  }));
  const opex = expenses.reduce((sum, line) => sum + line.amount, 0);
  const noi = egi - opex;
  const reserves = finite(deal.reservesPerSf) * sf + finite(deal.reservesPerUnit) * units;
  return {
    gpr,
    vacancyLoss,
    creditLoss,
    otherIncome: other,
    egi,
    expenses,
    opex,
    noi,
    reserves,
    cashFlowBeforeDebt: noi - reserves,
  };
}

interface PricedLine {
  id: string;
  csi: string;
  trade: string;
  scope: string;
  unit: string;
  qty: number;
  labor: number;
  material: number;
  equipment: number;
  waste: number;
  tax: number;
  total: number;
  source: 'estimate' | 'sub';
  subName: string;
  lowBid: number | null;
  highBid: number | null;
}

function priceLine(line: TradeLine, deal: Deal, location: number, quality: number): PricedLine | null {
  if (!line.included) return null;
  const share = finite(line.laborShare) + finite(line.materialShare) + finite(line.equipmentShare);
  const denom = share > 0 ? share : 1;
  const laborShare = finite(line.laborShare) / denom;
  const materialShare = finite(line.materialShare) / denom;
  const equipmentShare = finite(line.equipmentShare) / denom;
  const qty = Math.max(0, finite(line.qty));
  const base = qty * Math.max(0, finite(line.unitCost)) * location * quality;
  let labor = base * laborShare;
  if (deal.prevailingWage) labor *= Math.max(1, finite(deal.wageMultiplier, 1));
  const material = base * materialShare;
  const equipment = base * equipmentShare;
  const waste = material * Math.max(0, finite(line.waste));
  const tax = (material + waste) * Math.max(0, finite(deal.materialSalesTax));
  const estimate = labor + material + equipment + waste + tax;
  const quotes = line.bids.map((bid) =>
    bid.linked || bid.amount == null ? estimate * (finite(bid.factor, 1) || 1) : finite(bid.amount),
  );
  const selectedIndex = line.bids.findIndex((bid) => bid.selected);
  const selected = selectedIndex >= 0 ? line.bids[selectedIndex] : null;
  const total = selected ? quotes[selectedIndex] : estimate;
  const lowBid = quotes.length ? Math.min(...quotes) : null;
  const highBid = quotes.length ? Math.max(...quotes) : null;
  return {
    id: line.id,
    csi: line.csi,
    trade: line.trade,
    scope: line.scope,
    unit: line.unit,
    qty,
    labor: total * laborShare,
    material: total * materialShare,
    equipment: total * equipmentShare,
    waste: selected ? 0 : waste,
    tax: selected ? 0 : tax,
    total,
    source: selected ? 'sub' : 'estimate',
    subName: selected?.company ?? '',
    lowBid,
    highBid,
  };
}

function applyStack(direct: number, deal: Deal): { steps: StackStep[]; contractorBid: number; ownerHard: number } {
  const gc = deal.gc;
  const order: Array<[string, number]> = [
    ['Design contingency', gc.designContingency],
    ['Escalation', gc.escalation],
    ['General conditions', gc.generalConditions],
    ['Insurance', gc.insurance],
    ['Performance bond', gc.bond],
    ['Overhead', gc.overhead],
    ['Profit / fee', gc.profit],
  ];
  const steps: StackStep[] = [];
  let running = direct;
  for (const [name, pct] of order) {
    const rate = Math.max(0, finite(pct));
    const amount = running * rate;
    running += amount;
    steps.push({ name, pct: rate, amount, subtotal: running });
  }
  const contractorBid = running;
  const ownerPct = Math.max(0, finite(gc.constructionContingency));
  const ownerAmount = running * ownerPct;
  running += ownerAmount;
  steps.push({
    name: 'Owner contingency',
    pct: ownerPct,
    amount: ownerAmount,
    subtotal: running,
  });
  return { steps, contractorBid, ownerHard: running };
}

function debtServiceForYear(
  year: number,
  senior: number,
  mezz: number,
  seniorRate: number,
  mezzRate: number,
  amortYears: number,
  ioYears: number,
): number {
  const seniorDs =
    year <= ioYears ? senior * seniorRate : monthlyPayment(senior, seniorRate, amortYears) * 12;
  return seniorDs + mezz * mezzRate;
}

export function compute(deal: Deal, opts: ComputeOpts = {}): Omit<
  Underwriting,
  | 'constraints'
  | 'maxBid'
  | 'binding'
  | 'verdict'
  | 'reasons'
  | 'sensitivity'
  | 'score'
  | 'rateShockDscr'
> {
  const warnings: string[] = [];
  const rentScale = finite(opts.rentScale, 1) || 1;
  const hardScale = finite(opts.hardScale, 1) || 1;
  const rateAdd = finite(opts.rateAdd);
  const location = marketById(deal.marketId).factor;
  const quality = qualityFactor(deal.quality);
  const lines = deal.trades
    .map((line) => priceLine(line, deal, location, quality))
    .filter((line): line is PricedLine => line != null);
  const unscaledDirect = lines.reduce((sum, line) => sum + line.total, 0);
  const directCost = unscaledDirect * hardScale;
  const labor = lines.reduce((sum, line) => sum + line.labor, 0) * hardScale;
  const materials = lines.reduce((sum, line) => sum + line.material, 0) * hardScale;
  const equipment = lines.reduce((sum, line) => sum + line.equipment, 0) * hardScale;
  const wasteDollars = lines.reduce((sum, line) => sum + line.waste, 0) * hardScale;
  const materialTax = lines.reduce((sum, line) => sum + line.tax, 0) * hardScale;
  const { steps, contractorBid, ownerHard } = applyStack(directCost, deal);
  const softLines = [
    { label: 'Architecture & engineering', amount: ownerHard * Math.max(0, finite(deal.architecturePct)) },
    { label: 'Permits & fees', amount: ownerHard * Math.max(0, finite(deal.permitsPct)) },
    {
      label: 'Developer fee',
      amount: (finite(deal.purchasePrice) + ownerHard) * Math.max(0, finite(deal.developerFeePct)),
    },
    { label: 'FF&E', amount: Math.max(0, finite(deal.ffe)) },
    { label: 'Legal & closing counsel', amount: Math.max(0, finite(deal.legalFees)) },
    { label: 'Impact fees', amount: Math.max(0, finite(deal.impactFees)) },
    { label: 'Other soft costs', amount: Math.max(0, finite(deal.otherSoft)) },
  ];
  const softCost = softLines.reduce((sum, line) => sum + line.amount, 0);
  const closingCosts = finite(deal.purchasePrice) * Math.max(0, finite(deal.closingPct)) + Math.max(0, finite(deal.closingFixed));
  const c0 = Math.max(0, finite(deal.purchasePrice)) + closingCosts + ownerHard + softCost;
  const seniorLtc = clamp(deal.seniorLtc, 0, 0.9);
  const mezzLtc = clamp(deal.mezzLtc, 0, 0.45);
  if (seniorLtc + mezzLtc > 0.92) warnings.push('Senior plus mezzanine is above 92% of cost. Equity is thin.');
  const seniorRate = Math.max(0, finite(deal.interestRate) + rateAdd);
  const mezzRate = Math.max(0, finite(deal.mezzRate) + (mezzLtc > 0 ? rateAdd : 0));
  const reserveMonths = Math.max(0, finite(deal.reserveMonths));
  const kSenior = Math.max(0, finite(deal.points)) + seniorRate * (reserveMonths / 12) * 0.55;
  const kMezz = Math.max(0, finite(deal.mezzPoints)) + mezzRate * (reserveMonths / 12) * 0.5;
  const drag = seniorLtc * kSenior + mezzLtc * kMezz;
  let totalCost = c0;
  let senior = 0;
  let mezz = 0;
  if (drag >= 0.85) {
    warnings.push('Interest reserve and points are too large to solve inside the loan. Financing is added on top.');
    senior = seniorLtc * c0;
    mezz = mezzLtc * c0;
    totalCost = c0 + senior * kSenior + mezz * kMezz;
  } else if (drag > 0 || seniorLtc > 0 || mezzLtc > 0) {
    totalCost = c0 / (1 - drag);
    senior = seniorLtc * totalCost;
    mezz = mezzLtc * totalCost;
  }
  const financingCosts = Math.max(0, totalCost - c0);
  const pointsDollars = senior * Math.max(0, finite(deal.points)) + mezz * Math.max(0, finite(deal.mezzPoints));
  const interestReserve = Math.max(0, financingCosts - pointsDollars);
  const equity = totalCost - senior - mezz;
  if (equity < 0) warnings.push('Sources exceed uses. Lower the loan or raise the basis.');
  const stabilized = buildOps(deal, 'stabilized', totalCost, rentScale);
  const inPlace = buildOps(deal, 'in-place', totalCost, rentScale);
  const amortYears = Math.max(1, finite(deal.amortYears, 30));
  const ioYears = Math.max(0, finite(deal.ioYears));
  const holdYears = Math.max(1, Math.round(finite(deal.holdYears, 7)));
  const year1DebtService = debtServiceForYear(1, senior, mezz, seniorRate, mezzRate, amortYears, ioYears);
  const takeoutDebtService =
    monthlyPayment(senior, seniorRate, amortYears) * 12 + mezz * mezzRate;
  const year1CashFlow = stabilized.noi - stabilized.reserves - year1DebtService;
  const cashOnCash = equity > 5000 ? year1CashFlow / equity : null;
  const permanentDs = takeoutDebtService;
  const permanentCashFlow = stabilized.noi - stabilized.reserves - permanentDs;
  const permanentCashOnCash = equity > 5000 ? permanentCashFlow / equity : null;
  const dscr = takeoutDebtService > 1 ? stabilized.noi / takeoutDebtService : stabilized.noi > 0 ? 99 : 0;
  const debtYield = senior > 1 ? stabilized.noi / senior : stabilized.noi > 0 ? 99 : 0;
  const goingInCap = deal.purchasePrice > 1 ? inPlace.noi / deal.purchasePrice : null;
  const stabilizedCap = deal.purchasePrice > 1 ? stabilized.noi / deal.purchasePrice : null;
  const yieldOnCost = totalCost > 1 ? stabilized.noi / totalCost : null;
  const exitCap = finite(deal.exitCap);
  const spreadBps = yieldOnCost != null && exitCap > 0 ? (yieldOnCost - exitCap) * 10000 : null;
  if (stabilizedCap != null && seniorRate > stabilizedCap + 0.002 && deal.strategy !== 'ground-up') {
    warnings.push('Senior interest is above the stabilized cap rate, so leverage reduces cash yield.');
  }
  const growth = finite(deal.rentGrowth);
  const sellingCostPct = clamp(deal.sellingCostPct, 0, 0.2);
  const cashFlows: CashYear[] = [];
  const irrFlows: number[] = [-Math.max(0, equity)];
  let netSaleProceeds: number | null = null;
  let exitValue: number | null = null;
  let saleCosts = 0;
  let loanPayoff = 0;
  for (let year = 1; year <= holdYears; year += 1) {
    const noi = stabilized.noi * (1 + growth) ** (year - 1);
    const reserves = stabilized.reserves * (1 + growth) ** (year - 1);
    const debtService = debtServiceForYear(year, senior, mezz, seniorRate, mezzRate, amortYears, ioYears);
    let saleProceeds = 0;
    if (year === holdYears && exitCap > 0.005) {
      exitValue = (stabilized.noi * (1 + growth) ** holdYears) / exitCap;
      saleCosts = exitValue * sellingCostPct;
      const seniorPayoff = loanBalance(senior, seniorRate, amortYears, ioYears, holdYears);
      loanPayoff = seniorPayoff + mezz;
      netSaleProceeds = exitValue - saleCosts - loanPayoff;
      saleProceeds = netSaleProceeds;
    }
    const cashFlow = noi - reserves - debtService;
    cashFlows.push({ year, noi, debtService, reserves, cashFlow, saleProceeds });
    irrFlows.push(cashFlow + saleProceeds);
  }
  const equityMultiple =
    equity > 5000 ? irrFlows.slice(1).reduce((sum, cf) => sum + cf, 0) / equity : null;
  const solvedIrr = equity > 5000 ? irr(irrFlows) : null;
  const uses = [
    { label: deal.strategy === 'ground-up' ? 'Land' : 'Purchase', amount: finite(deal.purchasePrice) },
    { label: 'Closing costs', amount: closingCosts },
    { label: 'Owner hard cost', amount: ownerHard },
    { label: 'Soft costs', amount: softCost },
    { label: 'Financing costs', amount: financingCosts },
  ];
  const sources = [
    { label: 'Senior loan', amount: senior },
    { label: 'Mezzanine', amount: mezz },
    { label: 'Equity', amount: Math.max(0, equity) },
  ];
  const sf = deal.rentableSf > 0 ? deal.rentableSf : 1;
  return {
    warnings,
    locationFactor: location,
    qualityFactor: quality,
    lines,
    directCost,
    labor,
    materials,
    equipment,
    wasteDollars,
    materialTax,
    stack: steps,
    contractorBid,
    ownerHard,
    hardPerSf: ownerHard / sf,
    softLines,
    softCost,
    closingCosts,
    pointsDollars,
    interestReserve,
    financingCosts,
    senior,
    mezz,
    totalCost,
    equity,
    uses,
    sources,
    stabilized,
    inPlace,
    year1DebtService,
    takeoutDebtService,
    year1CashFlow,
    cashOnCash,
    permanentCashOnCash,
    dscr,
    debtYield,
    goingInCap,
    stabilizedCap,
    yieldOnCost,
    spreadBps,
    exitValue,
    saleCosts,
    loanPayoff,
    netSaleProceeds,
    equityMultiple,
    irr: solvedIrr,
    cashFlows,
  };
}

interface Rule {
  id: string;
  label: string;
  required: boolean;
  target: number;
  read: (u: ReturnType<typeof compute>) => number | null;
}

function rulesFor(deal: Deal): Rule[] {
  const yocTarget = finite(deal.exitCap) + finite(deal.yocSpread);
  return [
    {
      id: 'coc',
      label: 'Year-1 cash-on-cash',
      required: true,
      target: finite(deal.targetCashOnCash),
      read: (u) => u.cashOnCash,
    },
    {
      id: 'dscr',
      label: 'Takeout DSCR',
      required: true,
      target: finite(deal.targetDscr),
      read: (u) => u.dscr,
    },
    {
      id: 'yield',
      label: 'Debt yield',
      required: true,
      target: finite(deal.minDebtYield),
      read: (u) => u.debtYield,
    },
    {
      id: 'cap',
      label: 'Stabilized cap rate',
      required: deal.strategy !== 'ground-up',
      target: finite(deal.targetCapRate),
      read: (u) => u.stabilizedCap,
    },
    {
      id: 'yoc',
      label: 'Yield on cost',
      required: deal.strategy === 'ground-up' || deal.strategy === 'tenant-improvement',
      target: yocTarget,
      read: (u) => u.yieldOnCost,
    },
  ];
}

function maxPriceFor(deal: Deal, rule: Rule): number | null {
  if (!(rule.target > 0)) return null;
  const sf = Math.max(deal.rentableSf, 1);
  let hi = Math.max(deal.askingPrice, deal.purchasePrice, sf * 400, 25_000_000);
  const score = (price: number) => rule.read(compute({ ...deal, purchasePrice: price })) ?? -1;
  let guard = 0;
  while (score(hi) >= rule.target && guard < 5) {
    hi *= 1.45;
    guard += 1;
    if (hi > 12_000_000_000) return hi;
  }
  if (score(1_000) < rule.target) return null;
  let lo = 0;
  for (let i = 0; i < 42; i += 1) {
    const mid = (lo + hi) / 2;
    if (score(mid) >= rule.target) lo = mid;
    else hi = mid;
  }
  return lo;
}

function verdictFor(
  constraints: ConstraintResult[],
): { verdict: Underwriting['verdict']; reasons: string[]; score: number } {
  const required = constraints.filter((item) => item.required);
  const passes = required.filter((item) => item.pass).length;
  const ratio = required.map((item) => {
    if (item.value == null || !(item.target > 0)) return 0;
    return item.value / item.target;
  });
  const worst = ratio.length ? Math.min(...ratio) : 0;
  const score = Math.round(Math.max(0, Math.min(100, (ratio.reduce((s, n) => s + Math.min(1.15, n), 0) / Math.max(1, ratio.length)) * 100)));
  let verdict: Underwriting['verdict'] = 'DECLINE';
  if (required.length > 0 && passes === required.length) verdict = 'BID';
  else if (worst >= 0.9) verdict = 'STRETCH';
  const reasons = required.map((item) => {
    const state = item.pass ? 'clears' : 'misses';
    return `${item.label} ${state} its hurdle.`;
  });
  return { verdict, reasons, score };
}

export function underwrite(deal: Deal): Underwriting {
  const base = compute(deal);
  const rules = rulesFor(deal);
  const constraints: ConstraintResult[] = rules.map((rule) => {
    const value = rule.read(base);
    const price = rule.required ? maxPriceFor(deal, rule) : null;
    return {
      id: rule.id,
      label: rule.label,
      target: rule.target,
      value,
      price,
      pass: value != null && value + 1e-9 >= rule.target,
      required: rule.required,
    };
  });
  const bindingPool = constraints.filter((item) => item.required && item.price != null);
  const binding = bindingPool.reduce<ConstraintResult | null>(
    (lowest, item) => (lowest == null || (item.price ?? Infinity) < (lowest.price ?? Infinity) ? item : lowest),
    null,
  );
  const { verdict, reasons, score } = verdictFor(constraints);
  const rentScales = [0.9, 0.95, 1, 1.05, 1.1];
  const hardScales = [1, 1.08, 1.15];
  const sensitivity: SensitivityCell[] = [];
  for (const rentScale of rentScales) {
    for (const hardScale of hardScales) {
      const shocked = compute(deal, { rentScale, hardScale });
      sensitivity.push({
        rentScale,
        hardScale,
        cashOnCash: shocked.cashOnCash,
        dscr: shocked.dscr,
      });
    }
  }
  const shockedRate = compute(deal, { rateAdd: 0.01 });
  const extraReasons = [...reasons];
  if (binding?.price != null) {
    const gap = deal.purchasePrice - binding.price;
    if (gap > deal.purchasePrice * 0.01) {
      extraReasons.unshift(`${binding.label} sets the ceiling. This draft is above it.`);
    } else {
      extraReasons.unshift(`${binding.label} is the tightest ceiling, and this draft sits inside it.`);
    }
  }
  if (deal.askingPrice > deal.purchasePrice) {
    extraReasons.push('The draft bid is inside the asking price.');
  } else if (deal.askingPrice > 0 && deal.purchasePrice > deal.askingPrice) {
    extraReasons.push('The draft bid is through the asking price.');
  }
  return {
    ...base,
    constraints,
    maxBid: binding?.price ?? null,
    binding: binding?.label ?? null,
    verdict,
    reasons: extraReasons.slice(0, 5),
    sensitivity,
    score,
    rateShockDscr: shockedRate.dscr,
  };
}

export function portfolioRollup(books: Array<{ u: Underwriting }>): {
  totalCost: number;
  equity: number;
  noi: number;
  cashFlow: number;
  senior: number;
  cashOnCash: number | null;
  dscr: number | null;
  yieldOnCost: number | null;
} {
  const totalCost = books.reduce((sum, book) => sum + book.u.totalCost, 0);
  const equity = books.reduce((sum, book) => sum + Math.max(0, book.u.equity), 0);
  const noi = books.reduce((sum, book) => sum + book.u.stabilized.noi, 0);
  const cashFlow = books.reduce((sum, book) => sum + book.u.year1CashFlow, 0);
  const senior = books.reduce((sum, book) => sum + book.u.senior, 0);
  const takeout = books.reduce((sum, book) => sum + book.u.takeoutDebtService, 0);
  return {
    totalCost,
    equity,
    noi,
    cashFlow,
    senior,
    cashOnCash: equity > 5000 ? cashFlow / equity : null,
    dscr: takeout > 1 ? noi / takeout : null,
    yieldOnCost: totalCost > 1 ? noi / totalCost : null,
  };
}
