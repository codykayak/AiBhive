import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import type { NoteConfig } from '../types';
import type { HiveBrand } from '../branding';
import { loadPageData, savePageData } from '../storage';
import { colors, radii, spacing } from '../../theme/colors';

interface Props {
  appId: string;
  pageId: string;
  config: NoteConfig;
  brand: HiveBrand;
}

export default function NotePage({ appId, pageId, config, brand }: Props) {
  const [text, setText] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPageData<{ text: string }>(appId, pageId, { text: config.seedText || '' }).then((d) => {
      setText(d.text ?? config.seedText ?? '');
      setHydrated(true);
    });
  }, [appId, pageId, config.seedText]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void savePageData(appId, pageId, { text });
    }, 400);
  }, [text, hydrated, appId, pageId]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, { borderColor: brand.primarySoft }]}
        value={text}
        onChangeText={setText}
        multiline
        placeholder={config.placeholder || 'Write whatever you want…'}
        placeholderTextColor={colors.textDim}
        textAlignVertical="top"
      />
      <Text style={styles.savedHint}>Saved automatically as you type.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 320,
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 24,
  },
  savedHint: { color: colors.textDim, fontSize: 11, fontStyle: 'italic' },
});
