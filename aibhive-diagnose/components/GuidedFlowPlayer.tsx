import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { getGuidedFlow } from '@/lib/knowledge/guided';
import { getFaultById } from '@/lib/knowledge/search';

export function GuidedFlowPlayer({ flowId }: { flowId: string }) {
  const flow = useMemo(() => getGuidedFlow(flowId), [flowId]);
  const [stepId, setStepId] = useState(flow?.startStepId ?? '');

  if (!flow) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-hive-mist">Guided flow not found.</Text>
      </View>
    );
  }

  const step = flow.steps[stepId];
  if (!step) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-hive-mist">Broken flow step.</Text>
      </View>
    );
  }

  if (step.resultFaultId) {
    const fault = getFaultById(step.resultFaultId);
    return (
      <View className="flex-1 bg-hive-bg px-5 pt-6">
        <Text className="font-mono text-xs font-bold uppercase tracking-[2px] text-hive-amber">Result</Text>
        <Text className="mt-2 text-2xl font-bold text-hive-mist">{fault?.title ?? 'Matched fault'}</Text>
        <Text className="mt-2 text-base text-hive-steel">
          Guided triage landed here. Open the full playbook or jump into chat with this context.
        </Text>
        <View className="mt-6 gap-3">
          <BigButton
            label="Open fault playbook"
            onPress={() => router.push(`/fault/${step.resultFaultId}`)}
          />
          <BigButton
            label="Ask Diagnose chat"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/diagnose',
                params: { prompt: fault?.title ?? flow.title },
              })
            }
          />
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setStepId(flow.startStepId);
            }}
            className="items-center py-3"
          >
            <Text className="font-semibold text-hive-steel">Restart guided flow</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-hive-bg px-5 pt-6">
      <Text className="font-mono text-xs font-bold uppercase tracking-[2px] text-hive-amber">{flow.title}</Text>
      <Text className="mt-4 text-2xl font-bold leading-8 text-hive-mist">{step.prompt}</Text>
      <Text className="mt-3 text-sm text-hive-steel">Answer from what you see on site — big targets for gloves.</Text>

      <View className="mt-10 gap-4">
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (step.yesNext) setStepId(step.yesNext);
          }}
          className="min-h-[72px] items-center justify-center rounded-2xl bg-hive-success/20 border border-hive-success/40 active:opacity-80"
        >
          <Text className="text-xl font-bold text-hive-success">YES</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (step.noNext) setStepId(step.noNext);
          }}
          className="min-h-[72px] items-center justify-center rounded-2xl bg-hive-danger/20 border border-hive-danger/40 active:opacity-80"
        >
          <Text className="text-xl font-bold text-hive-danger">NO</Text>
        </Pressable>
      </View>
    </View>
  );
}
