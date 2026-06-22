import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
} from 'react-native';
import { Plus, Check, X } from 'lucide-react-native';
import type { ListConfig } from '../types';
import type { HiveBrand } from '../branding';
import { loadPageData, savePageData } from '../storage';
import { colors, radii, spacing } from '../../theme/colors';

type Item = { id: string; text: string; done: boolean; at: string };

interface Props {
  appId: string;
  pageId: string;
  config: ListConfig;
  brand: HiveBrand;
}

export default function ListPage({ appId, pageId, config, brand }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadPageData<Item[]>(appId, pageId, [])
      .then((existing) => {
        if (existing.length === 0 && config.seed?.length) {
          const seeded = config.seed.map((text, i) => ({
            id: `seed-${i}`,
            text,
            done: false,
            at: new Date().toISOString(),
          }));
          setItems(seeded);
        } else {
          setItems(existing);
        }
      })
      .finally(() => setHydrated(true));
  }, [appId, pageId, config.seed]);

  useEffect(() => {
    if (hydrated) void savePageData(appId, pageId, items);
  }, [items, appId, pageId, hydrated]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [
      { id: `${Date.now()}`, text, done: false, at: new Date().toISOString() },
      ...prev,
    ]);
    setDraft('');
  };

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const done = useMemo(() => items.filter((i) => i.done).length, [items]);

  return (
    <View style={styles.wrap}>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { borderColor: brand.primarySoft }]}
          value={draft}
          onChangeText={setDraft}
          placeholder={config.addPlaceholder || 'Add an item…'}
          placeholderTextColor={colors.textDim}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <TouchableOpacity
          onPress={add}
          style={[styles.addBtn, { backgroundColor: brand.primary }]}
          activeOpacity={0.85}
        >
          <Plus color={brand.contrastText} size={20} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>{config.emptyMessage || 'Nothing here yet.'}</Text>
      ) : (
        <>
          <Text style={styles.counter}>
            {done}/{items.length} done
          </Text>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.row, item.done && styles.rowDone]}>
                {config.showCheckbox !== false && (
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      { borderColor: brand.primarySoft },
                      item.done && { backgroundColor: brand.primary, borderColor: brand.primary },
                    ]}
                    onPress={() => toggle(item.id)}
                  >
                    {item.done && <Check color={brand.contrastText} size={14} />}
                  </TouchableOpacity>
                )}
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
                <TouchableOpacity onPress={() => remove(item.id)} hitSlop={10}>
                  <X color={colors.textDim} size={16} />
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  addRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { color: colors.textDim, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  rowDone: { opacity: 0.55 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1, color: colors.text, fontSize: 15 },
  itemTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
});
