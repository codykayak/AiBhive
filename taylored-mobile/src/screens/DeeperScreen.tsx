import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Mail, Phone } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { getActiveLlmConfig, getFirecrawlApiKey, sendChatMessage } from '../lib/ai';
import { saveCompanyIntel } from '../lib/jobs';
import { searchCompanyIntel } from '../lib/jobIntel';

export default function DeeperScreen() {
  const route = useRoute<any>();
  const { jobId, companyDetails, coldEmail } = route.params || { companyDetails: '', coldEmail: '' };
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [contacts, setContacts] = useState<Array<{ name?: string; role?: string; email?: string; phone?: string }>>([]);

  useEffect(() => {
    runDeeperAnalysis();
  }, []);

  const runDeeperAnalysis = async () => {
    try {
      const llm = await getActiveLlmConfig();
      const firecrawlKey = await getFirecrawlApiKey();
      if (!llm) {
        Alert.alert('API key required', 'Enable a provider in Settings and add an API key.');
        setLoading(false);
        return;
      }
      if (!firecrawlKey) {
        Alert.alert('Firecrawl required', 'Add a Firecrawl API key in Settings to research companies and contacts.');
        setLoading(false);
        return;
      }

      const companyName = (
        await sendChatMessage(
          llm,
          [],
          `Extract ONLY the company name from this job application text. If unknown, reply "Unknown":\n${companyDetails}`
        )
      )
        .trim()
        .replace(/[".]/g, '');

      if (!companyName || companyName.toLowerCase() === 'unknown') {
        Alert.alert('Company not found', 'Could not identify a company name from the job details.');
        setLoading(false);
        return;
      }

      const rawSearchResults = await searchCompanyIntel(companyName);
      if (!rawSearchResults) {
        setSummary(`We found "${companyName}" but could not pull live web results. Try again later.`);
        setContacts([]);
        setLoading(false);
        return;
      }

      const prompt = `Company: ${companyName}

Web research:
${rawSearchResults}

Task 1: Summarize the company in under 250 words for a job applicant.
Task 2: List likely decision makers or recruiters with any public contact hints found.

Return STRICT JSON only:
{
  "summary": "...",
  "decision_makers": [
    { "name": "...", "role": "...", "email": "...", "phone": "..." }
  ]
}`;

      const finalResult = await sendChatMessage(llm, [], prompt);
      const responseText = finalResult.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsedData = JSON.parse(responseText);
        setSummary(parsedData.summary || 'No summary available.');
        setContacts(parsedData.decision_makers || []);
        if (jobId && parsedData.summary) {
          await saveCompanyIntel(jobId, parsedData.summary);
        }
      } catch {
        setSummary(responseText || 'Could not parse research results.');
        setContacts([]);
      }
    } catch (e) {
      console.error(e);
      setSummary('Failed to fetch company intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (email: string) => {
    if (!email) return;
    await Clipboard.setStringAsync(coldEmail || '');
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Application follow-up')}`).catch(() =>
      Alert.alert('Error', 'Could not open your mail app.')
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.amberLight} />
        <Text style={styles.loadingText}>Scanning the hive for company intel...</Text>
      </View>
    );
  }

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <Text style={styles.pageTitle}>Company Intel</Text>
        <Text style={styles.sectionTitle}>Summary</Text>
        <GlassCard style={styles.cardSpacing}>
          <Text style={styles.text}>{summary}</Text>
        </GlassCard>

        <Text style={styles.sectionTitle}>Decision Makers</Text>
        {contacts.length === 0 ? (
          <Text style={styles.emptyText}>No public contacts were found in search results.</Text>
        ) : (
          contacts.map((c, i) => (
            <View key={`${c.name}-${i}`} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{c.name || 'Unknown name'}</Text>
                <Text style={styles.contactRole}>{c.role || 'Unknown role'}</Text>
              </View>
              <View style={styles.actionRow}>
                {!!c.email && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEmail(c.email!)}>
                    <Mail color={colors.black} size={16} />
                    <Text style={styles.actionText}>Email</Text>
                  </TouchableOpacity>
                )}
                {!!c.phone && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => Linking.openURL(`tel:${c.phone}`)}
                  >
                    <Phone color={colors.black} size={16} />
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  loadingText: { color: colors.amberLight, marginTop: spacing.md, textAlign: 'center' },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.amberLight, fontSize: 16, fontWeight: '800', marginBottom: 8, marginTop: 8 },
  cardSpacing: { marginBottom: spacing.md },
  text: { color: colors.text, fontSize: 15, lineHeight: 23 },
  emptyText: { color: colors.textMuted, marginBottom: spacing.lg },
  contactCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  contactInfo: { flex: 1 },
  contactName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  contactRole: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.amber,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    gap: 6,
  },
  callButton: { backgroundColor: colors.amberLight },
  actionText: { color: colors.black, fontWeight: '800', fontSize: 12 },
});
