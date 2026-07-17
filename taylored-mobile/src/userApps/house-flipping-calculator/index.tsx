import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator, TrendingUp } from 'lucide-react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { GlassCard, PrimaryButton, SectionLabel } from '../../components/ui';
import { keyboardAvoidBehavior } from '../../hooks/useKeyboardInset';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  calculateFlipDeal,
  formatCurrency,
  formatPercent,
  parseAmount,
  parsePercent,
  type FlipResults,
} from './calculations';

type FieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  suffix?: string;
};

function CurrencyField({ label, hint, value, onChangeText, suffix }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <View style={styles.inputRow}>
        {!suffix && <Text style={styles.prefix}>$</Text>}
        <TextInput
          style={[styles.input, suffix ? styles.inputFlex : styles.inputWithPrefix]}
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={colors.textDim}
          keyboardType="decimal-pad"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function ResultsPanel({ results }: { results: FlipResults | null }) {
  if (!results) {
    return (
      <GlassCard style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <Calculator color={colors.amberLight} size={20} />
          <Text style={styles.resultsTitle}>Results</Text>
        </View>
        <Text style={styles.resultsPlaceholder}>
          Enter your deal details and tap Calculate to see total investment, profit, and ROI.
        </Text>
      </GlassCard>
    );
  }

  const profitTone = results.projectedProfit >= 0 ? colors.success : colors.danger;

  return (
    <GlassCard style={styles.resultsCard} glow>
      <View style={styles.resultsHeader}>
        <TrendingUp color={colors.amberLight} size={20} />
        <Text style={styles.resultsTitle}>Project Summary</Text>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Total Investment</Text>
        <Text style={styles.resultValue}>{formatCurrency(results.totalInvestment)}</Text>
      </View>
      <Text style={styles.resultSub}>
        Purchase + renovation + buy closing + holding + loan interest
      </Text>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Estimated Sale Price</Text>
        <Text style={styles.resultValue}>{formatCurrency(results.estimatedSalePrice)}</Text>
      </View>

      <View style={[styles.resultRow, styles.resultHighlight]}>
        <Text style={styles.resultLabelStrong}>Projected Profit</Text>
        <Text style={[styles.resultValueStrong, { color: profitTone }]}>
          {formatCurrency(results.projectedProfit)}
        </Text>
      </View>
      <Text style={styles.resultSub}>
        After sell-side closing, commissions, and all project costs
      </Text>

      <View style={[styles.resultRow, styles.roiRow]}>
        <Text style={styles.resultLabelStrong}>Return on Investment (ROI)</Text>
        <Text style={[styles.roiValue, { color: profitTone }]}>{formatPercent(results.roi)}</Text>
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Cost breakdown</Text>
        <Text style={styles.breakdownLine}>Renovation: {formatCurrency(results.totalRenovation)}</Text>
        <Text style={styles.breakdownLine}>Buy closing: {formatCurrency(results.buyClosingCosts)}</Text>
        <Text style={styles.breakdownLine}>Holding: {formatCurrency(results.totalHoldingCosts)}</Text>
        <Text style={styles.breakdownLine}>Loan interest: {formatCurrency(results.loanInterest)}</Text>
        <Text style={styles.breakdownLine}>Sell closing: {formatCurrency(results.sellClosingCosts)}</Text>
        <Text style={styles.breakdownLine}>Agent commissions: {formatCurrency(results.agentCommissions)}</Text>
      </View>
    </GlassCard>
  );
}

export default function HouseFlippingCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [calculated, setCalculated] = useState(false);

  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [buildingMaterials, setBuildingMaterials] = useState('');
  const [laborCosts, setLaborCosts] = useState('');
  const [buyTitleInsurance, setBuyTitleInsurance] = useState('');
  const [buyEscrowFees, setBuyEscrowFees] = useState('');
  const [buyRecordingFees, setBuyRecordingFees] = useState('');
  const [buyOtherClosing, setBuyOtherClosing] = useState('');
  const [sellTitleEscrow, setSellTitleEscrow] = useState('');
  const [sellTransferFees, setSellTransferFees] = useState('');
  const [sellOtherClosing, setSellOtherClosing] = useState('');
  const [holdingMonths, setHoldingMonths] = useState('6');
  const [monthlyPropertyTax, setMonthlyPropertyTax] = useState('');
  const [monthlyInsurance, setMonthlyInsurance] = useState('');
  const [monthlyUtilities, setMonthlyUtilities] = useState('');
  const [listingCommissionPct, setListingCommissionPct] = useState('3');
  const [buyerAgentCommissionPct, setBuyerAgentCommissionPct] = useState('3');
  const [loanAmount, setLoanAmount] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');

  const results = useMemo(() => {
    if (!calculated) return null;
    return calculateFlipDeal({
      purchasePrice: parseAmount(purchasePrice),
      salePrice: parseAmount(salePrice),
      buildingMaterials: parseAmount(buildingMaterials),
      laborCosts: parseAmount(laborCosts),
      buyTitleInsurance: parseAmount(buyTitleInsurance),
      buyEscrowFees: parseAmount(buyEscrowFees),
      buyRecordingFees: parseAmount(buyRecordingFees),
      buyOtherClosing: parseAmount(buyOtherClosing),
      sellTitleEscrow: parseAmount(sellTitleEscrow),
      sellTransferFees: parseAmount(sellTransferFees),
      sellOtherClosing: parseAmount(sellOtherClosing),
      holdingMonths: parseAmount(holdingMonths) || 0,
      monthlyPropertyTax: parseAmount(monthlyPropertyTax),
      monthlyInsurance: parseAmount(monthlyInsurance),
      monthlyUtilities: parseAmount(monthlyUtilities),
      listingCommissionPct: parsePercent(listingCommissionPct),
      buyerAgentCommissionPct: parsePercent(buyerAgentCommissionPct),
      loanAmount: parseAmount(loanAmount),
      annualInterestRate: parsePercent(annualInterestRate),
    });
  }, [
    calculated,
    purchasePrice,
    salePrice,
    buildingMaterials,
    laborCosts,
    buyTitleInsurance,
    buyEscrowFees,
    buyRecordingFees,
    buyOtherClosing,
    sellTitleEscrow,
    sellTransferFees,
    sellOtherClosing,
    holdingMonths,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyUtilities,
    listingCommissionPct,
    buyerAgentCommissionPct,
    loanAmount,
    annualInterestRate,
  ]);

  const handleCalculate = () => setCalculated(true);

  return (
    <ScreenLayout
      title="House Flipping Calculator"
      subtitle="Estimate Oregon flip costs, profit, and ROI before you buy."
      showBrand={false}
      contentStyle={styles.content}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAvoidBehavior()}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Property</SectionLabel>
            <CurrencyField
              label="Original Purchase Price"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
            />
            <CurrencyField
              label="Estimated Sale Price (ARV)"
              hint="After-repair value you expect to sell for in Oregon."
              value={salePrice}
              onChangeText={setSalePrice}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Renovation — Oregon</SectionLabel>
            <Text style={styles.sectionNote}>
              Oregon labor rates and material costs vary by metro (Portland, Eugene, Bend). Enter
              your contractor quotes and supplier totals.
            </Text>
            <CurrencyField
              label="Building Materials"
              hint="Lumber, fixtures, appliances, permits, etc."
              value={buildingMaterials}
              onChangeText={setBuildingMaterials}
            />
            <CurrencyField
              label="Labor Costs"
              hint="Licensed contractors, electricians, plumbers, HVAC."
              value={laborCosts}
              onChangeText={setLaborCosts}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Title & Closing — Buying (Oregon)</SectionLabel>
            <Text style={styles.sectionNote}>
              Oregon uses escrow closings. Buyers typically pay title insurance, escrow, and county
              recording fees.
            </Text>
            <CurrencyField
              label="Owner's Title Insurance"
              value={buyTitleInsurance}
              onChangeText={setBuyTitleInsurance}
            />
            <CurrencyField
              label="Escrow & Settlement Fees"
              value={buyEscrowFees}
              onChangeText={setBuyEscrowFees}
            />
            <CurrencyField
              label="County Recording Fees"
              hint="Deed and mortgage recording at the county clerk."
              value={buyRecordingFees}
              onChangeText={setBuyRecordingFees}
            />
            <CurrencyField
              label="Other Buy-Side Closing"
              hint="Home inspection, appraisal, loan origination."
              value={buyOtherClosing}
              onChangeText={setBuyOtherClosing}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Title & Closing — Selling (Oregon)</SectionLabel>
            <Text style={styles.sectionNote}>
              Sellers often split escrow fees and may pay for buyer concessions. Oregon has no
              statewide real estate transfer tax on most residential sales.
            </Text>
            <CurrencyField
              label="Title & Escrow (Sell Side)"
              value={sellTitleEscrow}
              onChangeText={setSellTitleEscrow}
            />
            <CurrencyField
              label="Transfer / Local Fees"
              hint="City or county fees if applicable (e.g. some metro areas)."
              value={sellTransferFees}
              onChangeText={setSellTransferFees}
            />
            <CurrencyField
              label="Other Sell-Side Closing"
              hint="Repairs, staging, attorney fees."
              value={sellOtherClosing}
              onChangeText={setSellOtherClosing}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Holding Costs</SectionLabel>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Holding Period (months)</Text>
              <TextInput
                style={styles.input}
                value={holdingMonths}
                onChangeText={setHoldingMonths}
                placeholder="6"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
              />
            </View>
            <CurrencyField
              label="Monthly Property Taxes"
              hint="Oregon effective rates average ~0.87% of assessed value per year."
              value={monthlyPropertyTax}
              onChangeText={setMonthlyPropertyTax}
            />
            <CurrencyField
              label="Monthly Insurance"
              hint="Landlord/vacant property policy while renovating."
              value={monthlyInsurance}
              onChangeText={setMonthlyInsurance}
            />
            <CurrencyField
              label="Monthly Utilities"
              hint="Electric, water, gas during the flip."
              value={monthlyUtilities}
              onChangeText={setMonthlyUtilities}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Agent Commissions</SectionLabel>
            <Text style={styles.sectionNote}>
              Oregon listing agreements commonly total 4–6% split between listing and buyer's
              agents. Enter each side separately.
            </Text>
            <CurrencyField
              label="Listing Agent Commission"
              value={listingCommissionPct}
              onChangeText={setListingCommissionPct}
              suffix="%"
            />
            <CurrencyField
              label="Buyer's Agent Commission"
              value={buyerAgentCommissionPct}
              onChangeText={setBuyerAgentCommissionPct}
              suffix="%"
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SectionLabel style={styles.sectionLabel}>Financing</SectionLabel>
            <CurrencyField
              label="Loan Amount"
              hint="Hard money or construction loan balance."
              value={loanAmount}
              onChangeText={setLoanAmount}
            />
            <CurrencyField
              label="Annual Interest Rate"
              value={annualInterestRate}
              onChangeText={setAnnualInterestRate}
              suffix="%"
            />
          </GlassCard>

          <PrimaryButton label="Calculate" onPress={handleCalculate} style={styles.calculateBtn} />

          <ResultsPanel results={results} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.md },
  sectionCard: { marginBottom: spacing.md },
  sectionLabel: { marginTop: 0 },
  sectionNote: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  field: { marginBottom: spacing.sm },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  fieldHint: { color: colors.textDim, fontSize: 12, marginBottom: 6, lineHeight: 17 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: { color: colors.amberLight, fontSize: 16, fontWeight: '700', marginRight: 6 },
  suffix: { color: colors.textMuted, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    flex: 1,
  },
  inputWithPrefix: { flex: 1 },
  inputFlex: { flex: 1 },
  calculateBtn: { marginBottom: spacing.md },
  resultsCard: { marginBottom: spacing.lg },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  resultsTitle: { ...typography.h3, color: colors.amberLight },
  resultsPlaceholder: { ...typography.bodySm, color: colors.textMuted, lineHeight: 21 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  resultLabel: { ...typography.bodySm, color: colors.textMuted, flex: 1 },
  resultValue: { fontSize: 13, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  resultSub: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  resultHighlight: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  resultLabelStrong: { ...typography.body, color: colors.text, fontWeight: '800', flex: 1 },
  resultValueStrong: { ...typography.h3, fontVariant: ['tabular-nums'] },
  roiRow: { marginTop: spacing.sm },
  roiValue: { fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  breakdown: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    gap: 4,
  },
  breakdownTitle: {
    ...typography.overline,
    color: colors.textDim,
    marginBottom: 4,
  },
  breakdownLine: { ...typography.bodySm, color: colors.textMuted },
});
