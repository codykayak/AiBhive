import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';

const AI_PROVIDERS = ['Gemini', 'Grok', 'Kimi', 'Claude', 'Custom'];

export default function SettingsScreen() {
  const tabBarPadding = useTabBarPadding(24);
  const [selectedAI, setSelectedAI] = useState('Gemini');
  const [aiKey, setAiKey] = useState('');
  const [firecrawlKey, setFirecrawlKey] = useState('');

  useEffect(() => {
    const boot = async () => {
      const storedProvider = await SecureStore.getItemAsync('selected_ai_provider');
      if (storedProvider && AI_PROVIDERS.includes(storedProvider)) {
        setSelectedAI(storedProvider);
      }
      const storedFcKey = await SecureStore.getItemAsync('api_key_firecrawl');
      setFirecrawlKey(storedFcKey || '');
    };
    boot();
  }, []);

  useEffect(() => {
    const loadKey = async () => {
      const keyForCurrent = await SecureStore.getItemAsync(`api_key_${selectedAI.toLowerCase()}`);
      setAiKey(keyForCurrent || '');
    };
    loadKey();
  }, [selectedAI]);

  const handleProviderSelect = async (provider: string) => {
    setSelectedAI(provider);
    await SecureStore.setItemAsync('selected_ai_provider', provider);
    const keyForCurrent = await SecureStore.getItemAsync(`api_key_${provider.toLowerCase()}`);
    setAiKey(keyForCurrent || '');
  };

  const saveKeys = async () => {
    try {
      if (aiKey) await SecureStore.setItemAsync(`api_key_${selectedAI.toLowerCase()}`, aiKey);
      if (firecrawlKey) await SecureStore.setItemAsync('api_key_firecrawl', firecrawlKey);
      Alert.alert('Saved', 'Your API keys are stored securely on this device.');
    } catch {
      Alert.alert('Error', 'Failed to save settings securely');
    }
  };

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Connect your AI providers. Gemini powers resume generation; Firecrawl unlocks company intel."
      contentStyle={styles.content}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarPadding }}>
        <Text style={styles.sectionTitle}>AI Provider</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerRow}>
          {AI_PROVIDERS.map((provider) => (
            <PrimaryButton
              key={provider}
              label={provider}
              variant={selectedAI === provider ? 'primary' : 'secondary'}
              onPress={() => handleProviderSelect(provider)}
              style={styles.providerChip}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{selectedAI} API Key</Text>
        <TextInput
          style={styles.input}
          placeholder={`Enter ${selectedAI} API key`}
          placeholderTextColor={colors.textDim}
          value={aiKey}
          onChangeText={setAiKey}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>Firecrawl API Key</Text>
        <Text style={styles.helper}>Used for job URL scraping and company research in Auto-Bot Resume.</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Firecrawl API key"
          placeholderTextColor={colors.textDim}
          value={firecrawlKey}
          onChangeText={setFirecrawlKey}
          secureTextEntry
          autoCapitalize="none"
        />

        <PrimaryButton label="Save Settings" onPress={saveKeys} style={styles.saveButton} />
        <Text style={styles.version}>App version 1.0.3</Text>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  providerRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  providerChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 88,
  },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 15,
    fontSize: 16,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  version: {
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 12,
  },
});
