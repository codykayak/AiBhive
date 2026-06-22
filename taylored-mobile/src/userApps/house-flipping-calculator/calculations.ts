export type FlipInputs = {
  purchasePrice: number;
  salePrice: number;
  buildingMaterials: number;
  laborCosts: number;
  buyTitleInsurance: number;
  buyEscrowFees: number;
  buyRecordingFees: number;
  buyOtherClosing: number;
  sellTitleEscrow: number;
  sellTransferFees: number;
  sellOtherClosing: number;
  holdingMonths: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyUtilities: number;
  listingCommissionPct: number;
  buyerAgentCommissionPct: number;
  loanAmount: number;
  annualInterestRate: number;
};

export type FlipResults = {
  totalRenovation: number;
  buyClosingCosts: number;
  sellClosingCosts: number;
  totalHoldingCosts: number;
  agentCommissions: number;
  loanInterest: number;
  totalInvestment: number;
  estimatedSalePrice: number;
  projectedProfit: number;
  roi: number;
};

export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercent(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateFlipDeal(inputs: FlipInputs): FlipResults {
  const totalRenovation = inputs.buildingMaterials + inputs.laborCosts;

  const buyClosingCosts =
    inputs.buyTitleInsurance +
    inputs.buyEscrowFees +
    inputs.buyRecordingFees +
    inputs.buyOtherClosing;

  const sellClosingCosts =
    inputs.sellTitleEscrow + inputs.sellTransferFees + inputs.sellOtherClosing;

  const totalHoldingCosts =
    inputs.holdingMonths *
    (inputs.monthlyPropertyTax + inputs.monthlyInsurance + inputs.monthlyUtilities);

  const listingCommission = inputs.salePrice * (inputs.listingCommissionPct / 100);
  const buyerAgentCommission = inputs.salePrice * (inputs.buyerAgentCommissionPct / 100);
  const agentCommissions = listingCommission + buyerAgentCommission;

  const monthlyInterest = (inputs.loanAmount * (inputs.annualInterestRate / 100)) / 12;
  const loanInterest = monthlyInterest * inputs.holdingMonths;

  const totalInvestment =
    inputs.purchasePrice +
    totalRenovation +
    buyClosingCosts +
    totalHoldingCosts +
    loanInterest;

  const totalProjectCost = totalInvestment + sellClosingCosts + agentCommissions;
  const projectedProfit = inputs.salePrice - totalProjectCost;
  const roi = totalInvestment > 0 ? (projectedProfit / totalInvestment) * 100 : 0;

  return {
    totalRenovation,
    buyClosingCosts,
    sellClosingCosts,
    totalHoldingCosts,
    agentCommissions,
    loanInterest,
    totalInvestment,
    estimatedSalePrice: inputs.salePrice,
    projectedProfit,
    roi,
  };
}

export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
