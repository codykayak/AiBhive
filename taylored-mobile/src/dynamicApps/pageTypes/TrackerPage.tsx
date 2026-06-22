import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import type { TrackerConfig } from '../types';
import type { HiveBrand } from '../branding';
import { loadPageData, savePageData } from '../storage';
import { colors, radii, spacing } from '../../theme/colors';

type Entry = { id: string; value: number; at: string };

interface Props {
  appId: string;
  pageId: string;
  config: TrackerConfig;
  brand: HiveBrand;
}

export default function TrackerPage({ appId, pageId, config, brand }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState(String(config.defaultValue ?? 1));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadPageData<Entry[]>(appId, pageId, []).then((e) => {
      setEntries(e);
      setHydrated(true);
    });
  }, [appId, pageId]);

  useEffect(() => {
    if (hydrated) void savePageData(appId, pageId, entries);
  }, [entries, hydrated, appId, pageId]);

  const add = () => {
    const value = Number(draft);
    if (!Number.isFinite(value)) return;
    setEntries((prev) => [
      { id: `${Date.now()}`, value, at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const stats = useMemo(() => {
    const window = config.timeframeDays ?? 30;
    const cutoff = Date.now() - window * 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => Date.parse(e.at) >= cutoff);
    const values = recent.map((e) => e.value);
    if (!values.length) return { value: 0, label: 'No entries yet' };
    const aggregate = config.aggregate || 'sum';
    let v = 0;
    if (aggregate === 'sum') v = values.reduce((a, b) => a + b, 0);
    else if (aggregate === 'avg') v = values.reduce((a, b) => a + b, 0) / values.length;
    else if (aggregate === 'count') v = values.length;
    else v = values[0];
    return {
      value: Math.round(v * 100) / 100,
      label: `${aggregate} of last ${window} days`,
    };
  }, [entries, config.aggregate, config.timeframeDays]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.summary, { backgroundColor: brand.primarySoft, borderColor: brand.primary }]}>
        <Text style={[styles.summaryValue, { color: brand.primaryText }]}>
          {stats.value} <Text style={styles.summaryUnit}>{config.unit || ''}</Text>
        </Text>
        <Text style={styles.summaryLabel}>{stats.label}</Text>
      </View>

      <Text style={styles.prompt}>{config.prompt || 'Log an entry'}</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { borderColor: brand.primarySoft }]}
          value={draft}
          onChangeText={setDraft}
          keyboardType="decimal-pad"
          placeholder={`${config.defaultValue ?? 1}`}
          placeholderTextColor={colors.textDim}
        />
        <Text style={styles.unit}>{config.unit || ''}</Text>
        <TouchableOpacity
          onPress={add}
          style={[styles.addBtn, { backgroundColor: brand.primary }]}
          activeOpacity={0.85}
        >
          <Plus color={brand.contrastText} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} scrollEnabled={false}>
        {entries.slice(0, 30).map((e) => (
          <View key={e.id} style={styles.row}>
            <Text style={styles.rowVal}>
              {e.value} <Text style={styles.rowUnit}>{config.unit || ''}</Text>
            </Text>
            <Text style={styles.rowDate}>{new Date(e.at).toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => remove(e.id)} hitSlop={10}>
              <Trash2 color={colors.textDim} size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  summary: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 42, fontWeight: '800' },
  summaryUnit: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
  summaryLabel: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  prompt: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  unit: { color: colors.textMuted, fontWeight: '700' },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  rowVal: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  rowUnit: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  rowDate: { color: colors.textDim, fontSize: 12 },
});
