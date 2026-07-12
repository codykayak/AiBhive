import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { getFaultById } from '@/lib/knowledge/search';

export default function FaultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fault = getFaultById(typeof id === 'string' ? id : '');

  if (!fault) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg">
        <Text className="text-hive-mist">Fault not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="font-mono text-xs font-bold uppercase tracking-[2px] text-hive-amber">
        {fault.packId} · {fault.category} · {fault.severity}
      </Text>
      <Text className="mt-2 text-3xl font-bold text-hive-mist">{fault.title}</Text>

      <Section title="Symptoms">
        {fault.symptoms.map((s) => (
          <Bullet key={s} text={s} />
        ))}
      </Section>
      <Section title="Likely causes">
        {fault.likelyCauses.map((s) => (
          <Bullet key={s} text={s} />
        ))}
      </Section>
      <Section title="Step-by-step">
        {fault.steps.map((s, i) => (
          <Text key={s} className="mb-2 text-base leading-6 text-hive-mist">
            {i + 1}. {s}
          </Text>
        ))}
      </Section>
      <Section title="Safety">
        {fault.safety.map((s) => (
          <Bullet key={s} text={s} color={theme.colors.danger} />
        ))}
      </Section>
      <Section title="Tools">
        <Text className="text-base text-hive-mist">{fault.tools.join(' · ')}</Text>
      </Section>
      <Section title="Parts">
        <Text className="text-base text-hive-mist">{fault.parts.join(' · ') || 'Diagnose before ordering'}</Text>
      </Section>
      <Section title="Pro tips">
        {fault.proTips.map((s) => (
          <Bullet key={s} text={s} color={theme.colors.amber} />
        ))}
      </Section>

      <View className="mt-6 gap-3">
        <BigButton
          label="Run in Diagnose chat"
          onPress={() =>
            router.push({ pathname: '/(tabs)/diagnose', params: { prompt: fault.title } })
          }
        />
        <BigButton label="Back to library" variant="secondary" onPress={() => router.push('/tools/library')} />
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ text, color }: { text: string; color?: string }) {
  return (
    <Text className="mb-1.5 text-base leading-6 text-hive-mist" style={color ? { color } : undefined}>
      • {text}
    </Text>
  );
}
