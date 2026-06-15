import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AI_PROVIDERS = ['Gemini', 'Grok', 'Kimi', 'Claude', 'Custom'];

export default function SettingsScreen() {
  const [selectedAI, setSelectedAI] = useState('Gemini');
  const [aiKey, setAiKey] = useState('');
  const [firecrawlKey, setFirecrawlKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, [selectedAI]);

  const loadSettings = async () => {
    try {
      const storedProvider = await SecureStore.getItemAsync('selected_ai_provider');
      if (storedProvider && AI_PROVIDERS.includes(storedProvider) && selectedAI === 'Gemini' && storedProvider !== 'Gemini') {
          // Only update if it's the initial load to prevent infinite loop or jumping state
          setSelectedAI(storedProvider);
      }

      const keyForCurrent = await SecureStore.getItemAsync(`api_key_${selectedAI.toLowerCase()}`);
      if (keyForCurrent) setAiKey(keyForCurrent);
      else setAiKey('');

      const storedFcKey = await SecureStore.getItemAsync('api_key_firecrawl');
      if (storedFcKey) setFirecrawlKey(storedFcKey);

    } catch (e) {
      console.log('Error loading settings', e);
    }
  };

  const handleProviderSelect = async (provider: string) => {
    setSelectedAI(provider);
    await SecureStore.setItemAsync('selected_ai_provider', provider);
  };

  const saveKeys = async () => {
    try {
      if (aiKey) {
        await SecureStore.setItemAsync(`api_key_${selectedAI.toLowerCase()}`, aiKey);
      }
      if (firecrawlKey) {
        await SecureStore.setItemAsync('api_key_firecrawl', firecrawlKey);
      }
      Alert.alert('Success', 'Settings saved successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings securely');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <Text style={styles.sectionTitle}>Select AI Provider</Text>
      <View style={styles.providerContainer}>
        {AI_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={[styles.providerButton, selectedAI === provider && styles.providerButtonActive]}
            onPress={() => handleProviderSelect(provider)}
          >
            <Text style={[styles.providerText, selectedAI === provider && styles.providerTextActive]}>
              {provider}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{selectedAI} API Key</Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter ${selectedAI} API Key`}
        placeholderTextColor="#666"
        value={aiKey}
        onChangeText={setAiKey}
        secureTextEntry
      />

      <Text style={styles.sectionTitle}>Firecrawl API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Firecrawl API Key"
        placeholderTextColor="#666"
        value={firecrawlKey}
        onChangeText={setFirecrawlKey}
        secureTextEntry
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveKeys}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    color: '#00e5ff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  providerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  providerButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  providerButtonActive: {
    borderColor: '#00e5ff',
    backgroundColor: '#002b36',
  },
  providerText: {
    color: '#999',
  },
  providerTextActive: {
    color: '#00e5ff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00e5ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
