import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { GlassCard } from './ui';
import { colors, radii, spacing } from '../theme/colors';
import { fetchHivePlans, openPlanCheckout, type HivePlan } from '../lib/hivePlansApi';
import type { UsageBudget } from '../lib/hiveAccount';
import { HIVE_COPY } from '../constants/hiveCopy';

type Props = {
  usage?: UsageBudget | null;
  currentPlanId?: string;
  onRefresh?: () => void;
};

function priceLabel(plan: HivePlan): string {
  if (plan.priceUsd === 0) return 'Free';
  if (plan.interval === 'once') return `$${plan.priceUsd} once`;
  if (plan.interval === 'month') return `$${plan.priceUsd}/mo`;
  return `$${plan.priceUsd}`;
}

export function PlansPanel({ usage, currentPlanId = 'free', onRefresh }: Props) {
  const [plans, setPlans] = useState<HivePlan[]>([]);
  const [markup, setMarkup] = useState(1.3);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchHivePlans();
    if (data) {
      setPlans(data.plans);
      setMarkup(data.tokenMarkup);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const checkout = async (planId: string) => {
    if (planId === 'free' || planId === currentPlanId) return;
    setCheckingOut(planId);
    await openPlanCheckout(planId);
    setCheckingOut(null);
    onRefresh?.();
  };

  const usagePct =
    usage && usage.monthlyAllowanceUsd > 0
      ? Math.min(100, (usage.monthlyUsageUsd / usage.monthlyAllowanceUsd) * 100)
      : 0;

  return (
    <View>
      {usage && (
        <GlassCard style={styles.usageCard}>
          <Text style={styles.usageTitle}>
            {HIVE_COPY.planLabel(usage.planName)} · {HIVE_COPY.usageRemaining(usage.totalRemainingUsd)}
          </Text>
          {usage.monthlyAllowanceUsd > 0 && (
            <>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${usagePct}%` }]} />
              </View>
              <Text style={styles.usageMeta}>
                {HIVE_COPY.usageThisMonth(usage.monthlyUsageUsd, usage.monthlyAllowanceUsd)}
              </Text>
            </>
          )}
          {usage.creditBalanceUsd > 0 && (
            <Text style={styles.usageMeta}>{HIVE_COPY.balanceLabel(usage.creditBalanceUsd)}</Text>
          )}
          <Text style={styles.usageMeta}>{HIVE_COPY.tokenMarkupNote(markup)}</Text>
        </GlassCard>
      )}

      <Text style={styles.freeNote}>{HIVE_COPY.freeWithoutTokens}</Text>

      {loading ? (
        <ActivityIndicator color={colors.amber} style={{ marginVertical: spacing.md }} />
      ) : (
        plans.map((plan) => {
          const active = plan.id === currentPlanId;
          return (
            <GlassCard
              key={plan.id}
              style={active ? { ...styles.planCard, ...styles.planActive } : styles.planCard}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{priceLabel(plan)}</Text>
                </View>
                {active && (
                  <View style={styles.activeBadge}>
                    <Check color={colors.black} size={14} />
                    <Text style={styles.activeBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
              {plan.highlights.slice(0, 3).map((h) => (
                <Text key={h} style={styles.bullet}>
                  · {h}
                </Text>
              ))}
              {!active && plan.id !== 'free' && (
                <TouchableOpacity
                  style={styles.planBtn}
                  disabled={!!checkingOut}
                  onPress={() => void checkout(plan.id)}
                >
                  {checkingOut === plan.id ? (
                    <ActivityIndicator color={colors.black} size="small" />
                  ) : (
                    <Text style={styles.planBtnText}>
                      {plan.interval === 'once' ? `Get ${plan.name} — $${plan.priceUsd}` : `Subscribe — $${plan.priceUsd}/mo`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </GlassCard>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  usageCard: { padding: spacing.md, marginBottom: spacing.md },
  usageTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  barTrack: {
    height: 6,
    backgroundColor: colors.borderMuted,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', backgroundColor: colors.amber, borderRadius: radii.pill },
  usageMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  freeNote: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
  planCard: { padding: spacing.md, marginBottom: spacing.sm },
  planActive: { borderColor: colors.amber, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { color: colors.text, fontWeight: '900', fontSize: 18 },
  planPrice: { color: colors.amberLight, fontWeight: '800', fontSize: 16, marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  activeBadgeText: { color: colors.black, fontWeight: '800', fontSize: 11 },
  planTagline: { color: colors.textMuted, fontSize: 13, marginTop: 8, lineHeight: 18 },
  bullet: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  planBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.amber,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planBtnText: { color: colors.black, fontWeight: '800', fontSize: 14 },
});
