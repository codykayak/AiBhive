export type AssetId =
  | 'logistics'
  | 'mixed-use'
  | 'multifamily'
  | 'medical'
  | 'office'
  | 'retail'
  | 'industrial';

export type Strategy = 'acquire' | 'value-add' | 'ground-up' | 'tenant-improvement';

export type Quality = 'economy' | 'standard' | 'premium';

export type Phase = 'IOI' | 'Term sheet' | 'Best & Final' | 'IC memo' | 'GMP';

export interface IncomeLine {
  id: string;
  label: string;
  basis: 'fixed' | 'sf' | 'unit';
  /** Annual dollars, annual dollars per SF, or annual dollars per unit. */
  amount: number;
}

export interface ExpenseLine {
  id: string;
  label: string;
  basis: 'fixed' | 'sf' | 'unit' | 'egi' | 'price' | 'cost';
  /** Fixed dollars, $ per SF, $ per unit, or a decimal rate for egi/price/cost. */
  amount: number;
}

export interface SubQuote {
  company: string;
  /** Used when linked: quote = in-house estimate × factor. */
  factor: number;
  amount: number | null;
  linked: boolean;
  exclusions: string;
  days: number;
  selected: boolean;
}

export interface TradeLine {
  id: string;
  csi: string;
  trade: string;
  scope: string;
  unit: string;
  qty: number;
  /** National direct unit cost before location, quality, waste, and tax. */
  unitCost: number;
  laborShare: number;
  materialShare: number;
  equipmentShare: number;
  waste: number;
  included: boolean;
  bids: SubQuote[];
}

export interface GcStack {
  designContingency: number;
  escalation: number;
  generalConditions: number;
  insurance: number;
  bond: number;
  overhead: number;
  profit: number;
  constructionContingency: number;
}

export interface Deal {
  id: string;
  jobCode: string;
  name: string;
  address: string;
  marketId: string;
  assetId: AssetId;
  strategy: Strategy;
  quality: Quality;
  phase: Phase;
  image: string;
  sponsor: string;
  team: string[];
  grossSf: number;
  rentableSf: number;
  units: number;
  yearBuilt: number;
  bidDue: string;
  askingPrice: number;
  purchasePrice: number;
  prevailingWage: boolean;
  wageMultiplier: number;
  materialSalesTax: number;
  vacancy: number;
  inPlaceVacancy: number;
  creditLoss: number;
  rentBasis: 'sf' | 'unit';
  /** Annual in-place rent per SF or per unit. */
  inPlaceRent: number;
  inPlaceOther: number;
  income: IncomeLine[];
  expenses: ExpenseLine[];
  reservesPerSf: number;
  reservesPerUnit: number;
  trades: TradeLine[];
  gc: GcStack;
  architecturePct: number;
  permitsPct: number;
  developerFeePct: number;
  ffe: number;
  legalFees: number;
  impactFees: number;
  otherSoft: number;
  closingPct: number;
  closingFixed: number;
  seniorLtc: number;
  mezzLtc: number;
  interestRate: number;
  mezzRate: number;
  amortYears: number;
  ioYears: number;
  points: number;
  mezzPoints: number;
  reserveMonths: number;
  holdYears: number;
  exitCap: number;
  rentGrowth: number;
  sellingCostPct: number;
  targetCashOnCash: number;
  targetCapRate: number;
  targetDscr: number;
  minDebtYield: number;
  /** Required yield-on-cost spread over the exit cap. Decimal, 0.015 = 150 bps. */
  yocSpread: number;
  earnestPct: number;
  dueDiligenceDays: number;
  closingDays: number;
  financingContingency: boolean;
  inspectionContingency: boolean;
  scopeName: string;
  scopeLow: number;
  scopeHigh: number;
  groundLow: number;
  groundHigh: number;
  notes: string;
}

export interface ComputedLine {
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

export interface StackStep {
  name: string;
  pct: number;
  amount: number;
  subtotal: number;
}

export interface OpsLine {
  label: string;
  amount: number;
}

export interface Ops {
  gpr: number;
  vacancyLoss: number;
  creditLoss: number;
  otherIncome: number;
  egi: number;
  expenses: OpsLine[];
  opex: number;
  noi: number;
  reserves: number;
  cashFlowBeforeDebt: number;
}

export interface CashYear {
  year: number;
  noi: number;
  debtService: number;
  reserves: number;
  cashFlow: number;
  saleProceeds: number;
}

export interface ConstraintResult {
  id: string;
  label: string;
  target: number;
  value: number | null;
  price: number | null;
  pass: boolean;
  required: boolean;
}

export interface SensitivityCell {
  rentScale: number;
  hardScale: number;
  cashOnCash: number | null;
  dscr: number | null;
}

export interface Underwriting {
  warnings: string[];
  locationFactor: number;
  qualityFactor: number;
  lines: ComputedLine[];
  directCost: number;
  labor: number;
  materials: number;
  equipment: number;
  wasteDollars: number;
  materialTax: number;
  stack: StackStep[];
  contractorBid: number;
  ownerHard: number;
  hardPerSf: number;
  softLines: OpsLine[];
  softCost: number;
  closingCosts: number;
  pointsDollars: number;
  interestReserve: number;
  financingCosts: number;
  senior: number;
  mezz: number;
  totalCost: number;
  equity: number;
  uses: OpsLine[];
  sources: OpsLine[];
  stabilized: Ops;
  inPlace: Ops;
  year1DebtService: number;
  takeoutDebtService: number;
  year1CashFlow: number;
  cashOnCash: number | null;
  permanentCashOnCash: number | null;
  dscr: number | null;
  debtYield: number | null;
  goingInCap: number | null;
  stabilizedCap: number | null;
  yieldOnCost: number | null;
  spreadBps: number | null;
  exitValue: number | null;
  saleCosts: number;
  loanPayoff: number;
  netSaleProceeds: number | null;
  equityMultiple: number | null;
  irr: number | null;
  cashFlows: CashYear[];
  rateShockDscr: number | null;
  constraints: ConstraintResult[];
  maxBid: number | null;
  binding: string | null;
  verdict: 'BID' | 'STRETCH' | 'DECLINE';
  reasons: string[];
  sensitivity: SensitivityCell[];
  score: number;
}
