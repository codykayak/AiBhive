import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FileSearch, Package } from 'lucide-react-native';

import { ManualSearchLinks } from '@/components/ManualSearchLinks';
import { OrderPartModal } from '@/components/OrderPartModal';
import { theme } from '@/constants/theme';
import type { OrderPartPrefill } from '@/lib/diagnose/chatIntents';
import type { DiagnosisResult } from '@/lib/packs/types';
import type { ManualSearchLink } from '@/lib/knowledge/manualSearch';

type Props = {
  manualSearchLinks?: ManualSearchLink[];
  userQuery: string;
  assistantReply: string;
  structured?: DiagnosisResult;
  jobId?: string;
  jobTitle?: string;
  compact?: boolean;
  orderPartPrefill?: OrderPartPrefill;
  autoOpenOrder?: boolean;
  showOrderPart?: boolean;
};

/** Manual search + order part actions below a diagnosis. */
export function DiagnoseFieldActions({
  manualSearchLinks,
  userQuery,
  assistantReply,
  structured,
  jobId,
  jobTitle,
  compact = false,
  orderPartPrefill,
  autoOpenOrder = false,
  showOrderPart = false,
}: Props) {
  const [orderOpen, setOrderOpen] = useState(false);
  const showManual = Boolean(manualSearchLinks?.length);
  const showActions = showManual || showOrderPart;

  useEffect(() => {
    if (autoOpenOrder) setOrderOpen(true);
  }, [autoOpenOrder]);

  if (!showActions) return null;

  return (
    <View className={compact ? 'mt-2' : 'mt-0'}>
      <View
        className={`${compact ? '' : 'rounded-sm border border-hive-border bg-hive-card p-3'} ${showManual ? 'border-t border-hive-border pt-3 mt-3' : ''}`}
      >
        {showManual || showOrderPart ? (
          <Text className="text-xs font-bold uppercase tracking-wider text-hive-brand mb-2">
            Field resources
          </Text>
        ) : null}

        {showManual ? <ManualSearchLinks links={manualSearchLinks!} compact /> : null}

        {showOrderPart ? (
          <Pressable
            onPress={() => setOrderOpen(true)}
            className={`min-h-[48px] flex-row items-center gap-3 border border-hive-border bg-hive-elevated px-3 py-2.5 active:opacity-80 ${showManual ? 'mt-3' : ''}`}
            style={{ borderRadius: theme.radius.sm }}
          >
            <Package color={theme.colors.amber} size={18} />
            <View className="flex-1">
              <Text className="font-bold text-hive-mist text-sm">Order part</Text>
              <Text className="text-[11px] text-hive-steel mt-0.5">
                AI suggests part # · office approves & orders
              </Text>
            </View>
          </Pressable>
        ) : null}

        {!showManual && showOrderPart ? (
          <View className="flex-row items-center gap-2 mt-3 opacity-70">
            <FileSearch color={theme.colors.steel} size={14} />
            <Text className="text-[11px] text-hive-steel">
              Manual PDF search appears when a model # has no ingested manual.
            </Text>
          </View>
        ) : null}
      </View>

      <OrderPartModal
        visible={orderOpen}
        onClose={() => setOrderOpen(false)}
        userQuery={userQuery}
        assistantReply={assistantReply}
        structured={structured}
        jobId={jobId}
        jobTitle={jobTitle}
        initialPrefill={orderPartPrefill}
      />
    </View>
  );
}
