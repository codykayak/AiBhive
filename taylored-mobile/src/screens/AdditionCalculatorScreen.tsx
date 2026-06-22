import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

export default function AdditionCalculatorScreen() {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [sum, setSum] = useState<number | null>(null);

  const handleAdd = () => {
    const a = parseFloat(first) || 0;
    const b = parseFloat(second) || 0;
    setSum(a + b);
  };

  return (
    <ScreenLayout
      title="Addition Calculator"
      subtitle="Enter two numbers and tap Add to see their sum."
      showBrand={false}
      contentStyle={styles.content}
    >
      <GlassCard style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>First number</Text>
          <TextInput
            style={styles.input}
            value={first}
            onChangeText={setFirst}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textDim}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Second number</Text>
          <TextInput
            style={styles.input}
            value={second}
            onChangeText={setSecond}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textDim}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
        </View>

        <PrimaryButton label="Add" icon={Plus} onPress={handleAdd} style={styles.button} />

        {sum !== null && (
          <View style={styles.resultWrap}>
            <Text style={styles.resultLabel}>Sum</Text>
            <Text style={styles.resultValue}>{sum}</Text>
          </View>
        )}
      </GlassCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.xs,
  },
  resultWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    marginTop: spacing.sm,
  },
  resultLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  resultValue: {
    ...typography.h1,
    color: colors.amberLight,
    fontSize: 36,
  },
});
