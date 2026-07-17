import { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';

export type FeedbackFormValues = {
  outcome: 'worked' | 'didnt';
  equipmentSymptom: string;
  fixSummary: string;
  tipText: string;
  equipmentLabel: string;
  shareWithTeam: boolean;
  shareAnonymously: boolean;
};

type Props = {
  defaultAnonymous: boolean;
  busy?: boolean;
  error?: string | null;
  onSubmit: (values: FeedbackFormValues) => void;
  onSkip: () => void;
};

/**
 * Lightweight post-diagnose card:
 * 1) Did it work? Yes / No
 * 2) Share with your team (+ optional anonymous network)
 */
export function DiagnosisFeedbackCard({ defaultAnonymous, busy, error, onSubmit, onSkip }: Props) {
  const [step, setStep] = useState<'ask' | 'form'>('ask');
  const [outcome, setOutcome] = useState<'worked' | 'didnt' | null>(null);
  const [equipmentSymptom, setEquipmentSymptom] = useState('');
  const [fixSummary, setFixSummary] = useState('');
  const [tipText, setTipText] = useState('');
  const [equipmentLabel, setEquipmentLabel] = useState('');
  const [shareWithTeam, setShareWithTeam] = useState(true);
  const [shareAnonymously, setShareAnonymously] = useState(defaultAnonymous);

  const choose = (next: 'worked' | 'didnt') => {
    setOutcome(next);
    setStep('form');
  };

  const submit = () => {
    if (!outcome) return;
    onSubmit({
      outcome,
      equipmentSymptom: equipmentSymptom.trim(),
      fixSummary: fixSummary.trim(),
      tipText: tipText.trim(),
      equipmentLabel: equipmentLabel.trim(),
      shareWithTeam,
      shareAnonymously,
    });
  };

  if (step === 'ask') {
    return (
      <View className="mt-2 rounded-sm border border-hive-amber/40 bg-hive-elevated p-3">
        <Text className="text-sm font-bold text-hive-mist">Did what I suggest work?</Text>
        <Text className="mt-1 text-xs text-hive-steel">
          Your answer helps your shop — and anonymously strengthens Diagnose for everyone.
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => choose('worked')}
            className="min-h-[44px] flex-1 items-center justify-center rounded-sm bg-hive-success/20 border border-hive-success/40"
          >
            <Text className="font-bold text-hive-mist">Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => choose('didnt')}
            className="min-h-[44px] flex-1 items-center justify-center rounded-sm bg-hive-danger/15 border border-hive-danger/40"
          >
            <Text className="font-bold text-hive-mist">No</Text>
          </Pressable>
          <Pressable onPress={onSkip} className="min-h-[44px] items-center justify-center px-3">
            <Text className="text-xs font-semibold text-hive-steel">Skip</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-2 rounded-sm border border-hive-border bg-hive-elevated p-3">
      <Text className="text-base font-bold text-hive-amber">Share with your team</Text>
      <Text className="mt-1 text-xs leading-4 text-hive-steel">
        {outcome === 'worked'
          ? 'Optional: capture what worked so the next tech sees it.'
          : 'What was actually wrong, and what fixed it? Keep it short.'}
      </Text>

      <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-hive-steel">
        Equipment / model
      </Text>
      <TextInput
        value={equipmentLabel}
        onChangeText={setEquipmentLabel}
        placeholder="e.g. Napoleon gas fireplace GDS50"
        placeholderTextColor={theme.colors.steel}
        className="mt-1 min-h-[44px] rounded-sm border border-hive-border bg-hive-bg px-3 text-sm text-hive-mist"
      />

      {outcome === 'didnt' ? (
        <>
          <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-hive-steel">
            What was actually wrong?
          </Text>
          <TextInput
            value={equipmentSymptom}
            onChangeText={setEquipmentSymptom}
            placeholder="Pilot tip thermocouple / orifice clog…"
            placeholderTextColor={theme.colors.steel}
            multiline
            className="mt-1 min-h-[56px] rounded-sm border border-hive-border bg-hive-bg px-3 py-2 text-sm text-hive-mist"
          />
          <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-hive-steel">
            What fixed it?
          </Text>
          <TextInput
            value={fixSummary}
            onChangeText={setFixSummary}
            placeholder="Replaced thermocouple, cleaned pilot orifice…"
            placeholderTextColor={theme.colors.steel}
            multiline
            className="mt-1 min-h-[56px] rounded-sm border border-hive-border bg-hive-bg px-3 py-2 text-sm text-hive-mist"
          />
        </>
      ) : (
        <>
          <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-hive-steel">
            Tip for the next tech (optional)
          </Text>
          <TextInput
            value={tipText}
            onChangeText={setTipText}
            placeholder="Confirmed: clean the coin trap before condemning the pump."
            placeholderTextColor={theme.colors.steel}
            multiline
            className="mt-1 min-h-[56px] rounded-sm border border-hive-border bg-hive-bg px-3 py-2 text-sm text-hive-mist"
          />
        </>
      )}

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-sm text-hive-mist">Save to shop playbook</Text>
        <Switch
          value={shareWithTeam}
          onValueChange={setShareWithTeam}
          trackColor={{ false: theme.colors.border, true: `${theme.colors.amber}88` }}
          thumbColor={shareWithTeam ? theme.colors.amber : theme.colors.steel}
        />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-hive-mist">Share anonymously with other users</Text>
          <Text className="text-[11px] text-hive-steel">
            No names, customers, or addresses — helps Diagnose learn faster.
          </Text>
        </View>
        <Switch
          value={shareAnonymously}
          onValueChange={setShareAnonymously}
          trackColor={{ false: theme.colors.border, true: `${theme.colors.amber}88` }}
          thumbColor={shareAnonymously ? theme.colors.amber : theme.colors.steel}
        />
      </View>

      {error ? <Text className="mt-2 text-sm text-hive-danger">{error}</Text> : null}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          disabled={busy}
          onPress={submit}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-sm ${busy ? 'bg-hive-border' : 'bg-hive-amber'}`}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.onOrange} />
          ) : (
            <Text className="font-bold text-hive-bg">Submit</Text>
          )}
        </Pressable>
        <Pressable onPress={onSkip} className="min-h-[48px] items-center justify-center px-3">
          <Text className="text-sm font-semibold text-hive-steel">Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}
