import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import {
  POOL_CHEM_TARGETS,
  estimateAcidOz,
  estimateLiquidChlorineOz,
  estimateSaltLbs,
  slamFcTarget,
} from '@/lib/knowledge/pool/chemistry';

export default function ChemistryScreen() {
  const [gallons, setGallons] = useState('15000');
  const [ph, setPh] = useState('7.8');
  const [targetPh, setTargetPh] = useState('7.4');
  const [fcDelta, setFcDelta] = useState('2');
  const [saltDelta, setSaltDelta] = useState('400');
  const [cya, setCya] = useState('60');

  const g = Number(gallons) || 0;
  const acid = useMemo(() => estimateAcidOz(g, Number(ph) || 0, Number(targetPh) || 0), [g, ph, targetPh]);
  const chlorine = useMemo(() => estimateLiquidChlorineOz(g, Number(fcDelta) || 0), [g, fcDelta]);
  const salt = useMemo(() => estimateSaltLbs(g, Number(saltDelta) || 0), [g, saltDelta]);
  const slam = useMemo(() => slamFcTarget(Number(cya) || 0), [cya]);

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-base text-hive-steel">
        Field estimators — always confirm with a good test kit. Numbers are heuristics, not lab gospel.
      </Text>

      <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-hive-steel">Targets</Text>
      <View className="gap-2">
        {POOL_CHEM_TARGETS.map((t) => (
          <View key={t.name} className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-3">
            <Text className="font-bold text-hive-mist">{t.name}</Text>
            <Text className="text-hive-amber">
              {t.min}–{t.max} {t.unit}
            </Text>
            <Text className="mt-1 text-sm text-hive-steel">{t.tip}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Dosing desk</Text>
      <Field label="Pool gallons" value={gallons} onChange={setGallons} />

      <View className="mt-4 rounded-2xl border border-hive-border bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">Lower pH (muriatic ~31%)</Text>
        <View className="mt-2 flex-row gap-2">
          <Field label="Now" value={ph} onChange={setPh} flex />
          <Field label="Target" value={targetPh} onChange={setTargetPh} flex />
        </View>
        <Text className="mt-3 text-lg font-bold text-hive-pool">≈ {acid} oz acid</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-hive-border bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">Raise FC (12.5% liquid chlorine)</Text>
        <Field label="Δ ppm" value={fcDelta} onChange={setFcDelta} />
        <Text className="mt-3 text-lg font-bold text-hive-pool">≈ {chlorine} oz</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-hive-border bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">Add salt</Text>
        <Field label="Δ ppm" value={saltDelta} onChange={setSaltDelta} />
        <Text className="mt-3 text-lg font-bold text-hive-pool">≈ {salt} lbs</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-hive-border bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">SLAM FC target from CYA</Text>
        <Field label="CYA ppm" value={cya} onChange={setCya} />
        <Text className="mt-3 text-lg font-bold text-hive-amber">Aim ≈ {slam} ppm FC</Text>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  flex,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  flex?: boolean;
}) {
  return (
    <View className={flex ? 'mt-2 flex-1' : 'mt-2'}>
      <Text className="mb-1 text-xs text-hive-steel">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholderTextColor={theme.colors.steel}
        className="min-h-[48px] rounded-xl border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
      />
    </View>
  );
}
