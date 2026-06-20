import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function QuickPrompts({ prompts, onSelect, disabled }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Try saying</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {prompts.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, disabled && styles.chipDisabled]}
            onPress={() => onSelect(p)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    ...typography.overline,
    color: colors.textDim,
    marginBottom: 8,
    marginLeft: 2,
  },
  row: { gap: 8, paddingRight: spacing.md },
  chip: {
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    color: colors.amberLight,
    fontWeight: '700',
    fontSize: 13,
  },
});
