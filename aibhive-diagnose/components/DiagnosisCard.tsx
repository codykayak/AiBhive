import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { DiagnosisResult } from '@/lib/packs/types';
import { theme } from '@/constants/theme';

type Props = {
  result: DiagnosisResult;
};

export function DiagnosisCard({ result }: Props) {
  const [done, setDone] = useState<Record<number, boolean>>({});

  const toggle = useCallback((index: number) => {
    setDone((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  return (
    <View className="mb-3 max-w-[92%] self-start rounded-sm rounded-bl-md border border-hive-border bg-hive-card px-4 py-3">
      {result.summary ? (
        <Text className="text-base leading-6 text-hive-mist">{result.summary}</Text>
      ) : null}

      {result.likelyCauses.length ? (
        <Section title="Likely causes">
          {result.likelyCauses.map((cause) => (
            <Text key={cause} className="mb-1 text-sm leading-5 text-hive-steel">
              · {cause}
            </Text>
          ))}
        </Section>
      ) : null}

      {result.steps.length ? (
        <Section title="Steps">
          {result.steps.map((step, index) => {
            const checked = Boolean(done[index]);
            return (
              <Pressable
                key={`${index}-${step.slice(0, 24)}`}
                onPress={() => toggle(index)}
                className="mb-2 min-h-[44px] flex-row items-start gap-3 active:opacity-70"
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <View
                  className="mt-0.5 h-6 w-6 items-center justify-center rounded-md border"
                  style={{
                    borderColor: checked ? theme.colors.amber : theme.colors.border,
                    backgroundColor: checked ? theme.colors.amber : 'transparent',
                  }}
                >
                  {checked ? (
                    <Text style={{ color: theme.colors.bg, fontWeight: '800', fontSize: 12 }}>✓</Text>
                  ) : null}
                </View>
                <Text
                  className="flex-1 text-sm leading-5"
                  style={{
                    color: checked ? theme.colors.steel : theme.colors.mist,
                    textDecorationLine: checked ? 'line-through' : 'none',
                  }}
                >
                  {step}
                </Text>
              </Pressable>
            );
          })}
        </Section>
      ) : null}

      {result.safetyNotes.length ? (
        <Section title="Safety">
          {result.safetyNotes.map((note) => (
            <Text key={note} className="mb-1 text-sm leading-5 text-hive-danger">
              · {note}
            </Text>
          ))}
        </Section>
      ) : null}

      {result.partsToCheck.length ? (
        <Section title="Parts / tools">
          {result.partsToCheck.map((part) => (
            <Text key={part} className="mb-1 text-sm leading-5 text-hive-steel">
              · {part}
            </Text>
          ))}
        </Section>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-hive-amber">
        {title}
      </Text>
      {children}
    </View>
  );
}
