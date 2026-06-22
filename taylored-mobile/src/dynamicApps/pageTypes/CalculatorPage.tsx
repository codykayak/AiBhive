import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import type { CalculatorConfig } from '../types';
import type { HiveBrand } from '../branding';
import { loadPageData, savePageData } from '../storage';
import { colors, radii, spacing } from '../../theme/colors';

interface Props {
  appId: string;
  pageId: string;
  config: CalculatorConfig;
  brand: HiveBrand;
}

/**
 * Safe formula evaluator: replaces input ids with their numeric value and
 * uses Function() in a sandbox. Only digits, math operators, parens, dots,
 * and Math.* are allowed.
 */
function evalFormula(formula: string, values: Record<string, number>): number | null {
  let expr = formula || '';
  for (const [id, val] of Object.entries(values)) {
    const safeId = id.replace(/[^a-zA-Z0-9_]/g, '');
    expr = expr.replace(new RegExp(`\\b${safeId}\\b`, 'g'), `(${Number(val) || 0})`);
  }
  if (!/^[\d\s+\-*/().,a-zA-Z_]*$/.test(expr)) return null;
  expr = expr.replace(/Math\./g, 'Math.');
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('Math', `"use strict"; return (${expr});`);
    const result = fn(Math);
    if (!Number.isFinite(result)) return null;
    return Math.round(result * 1000) / 1000;
  } catch {
    return null;
  }
}

export default function CalculatorPage({ appId, pageId, config, brand }: Props) {
  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const i of config.inputs) {
      map[i.id] = String(i.defaultValue ?? '');
    }
    return map;
  }, [config.inputs]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadPageData<Record<string, string>>(appId, pageId, initial).then((stored) => {
      setValues({ ...initial, ...stored });
      setHydrated(true);
    });
  }, [appId, pageId, initial]);

  useEffect(() => {
    if (hydrated) void savePageData(appId, pageId, values);
  }, [values, hydrated, appId, pageId]);

  const numericValues = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) out[k] = Number(v) || 0;
    return out;
  }, [values]);

  const result = useMemo(() => evalFormula(config.formula, numericValues), [config.formula, numericValues]);

  return (
    <View style={styles.wrap}>
      {config.inputs.map((input) => (
        <View key={input.id} style={styles.field}>
          <Text style={styles.label}>
            {input.label} {input.unit ? <Text style={styles.unit}>({input.unit})</Text> : null}
          </Text>
          <TextInput
            style={[styles.input, { borderColor: brand.primarySoft }]}
            value={values[input.id] ?? ''}
            onChangeText={(t) => setValues((prev) => ({ ...prev, [input.id]: t }))}
            keyboardType="decimal-pad"
            placeholder={String(input.defaultValue ?? '')}
            placeholderTextColor={colors.textDim}
          />
        </View>
      ))}

      <View style={[styles.result, { backgroundColor: brand.primarySoft, borderColor: brand.primary }]}>
        <Text style={styles.resultLabel}>{config.resultLabel || 'Result'}</Text>
        <Text style={[styles.resultValue, { color: brand.primaryText }]}>
          {result === null ? '—' : result}
          {config.resultUnit ? <Text style={styles.resultUnit}> {config.resultUnit}</Text> : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  unit: { color: colors.textMuted, fontWeight: '500' },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  result: {
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  resultLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  resultValue: { fontSize: 38, fontWeight: '800', marginTop: 4 },
  resultUnit: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
});
