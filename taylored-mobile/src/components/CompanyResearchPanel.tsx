import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  TextInput,
  Switch,
} from 'react-native';
import { Mail, Phone, MapPin } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from '../components/ui';
import { getActiveLlmConfig, getFirecrawlApiKey, sendChatMessage } from '../lib/ai';
import { saveCompanyIntel, type CompanyContact, type JobApplication } from '../lib/jobs';
import { searchCompanyIntel } from '../lib/jobIntel';
import { colors, radii, spacing } from '../theme/colors';

type Props = {
  job: JobApplication;
  onUpdated: (job: JobApplication) => void;
};

export function CompanyResearchPanel({ job, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(job.companyIntelSummary || '');
  const [contacts, setContacts] = useState<CompanyContact[]>(job.companyContacts || []);
  const [location, setLocation] = useState(job.searchLocation || '');
  const [localOnly, setLocalOnly] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(String(job.searchRadiusMiles ?? 50));

  const runResearch = async () => {
    setLoading(true);
    try {
      const llm = await getActiveLlmConfig();
      const firecrawlKey = await getFirecrawlApiKey();
      if (!llm) {
        Alert.alert('API key required', 'Enable a provider in Settings and add an API key.');
        return;
      }
      if (!firecrawlKey) {
        Alert.alert('Research key required', 'Add a Firecrawl API key in Settings for company research.');
        return;
      }

      const companyName =
        job.companyName ||
        (
          await sendChatMessage(
            llm,
            [],
            `Extract ONLY the company name from this text. If unknown, reply Unknown:\n${job.jobDetails || job.companyName || ''}`
          )
        )
          .trim()
          .replace(/[".]/g, '');

      if (!companyName || companyName.toLowerCase() === 'unknown') {
        Alert.alert('Company not found', 'Could not identify a company from this application.');
        return;
      }

      const miles = Math.min(100, Math.max(30, parseInt(radiusMiles, 10) || 50));
      const rawSearchResults = await searchCompanyIntel({
        companyName,
        location: localOnly ? location : undefined,
        radiusMiles: localOnly ? miles : undefined,
      });

      if (!rawSearchResults) {
        setSummary(`We found "${companyName}" but could not pull live results. Try again.`);
        setContacts([]);
        return;
      }

      const locationHint = localOnly && location.trim()
        ? `Focus on contacts near ${location.trim()} within ${miles} miles when possible.`
        : '';

      const prompt = `Company: ${companyName}
${locationHint}

Web research:
${rawSearchResults}

Task 1: Summarize the company for a job applicant (under 250 words).
Task 2: List decision makers, recruiters, or hiring contacts. Include email and phone when found in the research — do not invent contacts.

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
        const parsed = JSON.parse(responseText);
        const nextContacts: CompanyContact[] = parsed.decision_makers || [];
        const nextSummary = parsed.summary || 'No summary available.';
        setSummary(nextSummary);
        setContacts(nextContacts);

        const updated = await saveCompanyIntel(job.id, nextSummary, nextContacts, {
          searchRadiusMiles: localOnly ? miles : undefined,
          searchLocation: localOnly ? location : undefined,
        });
        if (updated) onUpdated(updated);
      } catch {
        setSummary(responseText || 'Could not parse research results.');
        setContacts([]);
      }
    } catch {
      setSummary('Research failed. Check your connection and API keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (email: string) => {
    if (!email) return;
    if (job.coldEmail) await Clipboard.setStringAsync(job.coldEmail);
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Application follow-up')}`).catch(() =>
      Alert.alert('Error', 'Could not open your mail app.')
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <GlassCard style={styles.filterCard}>
        <View style={styles.filterRow}>
          <MapPin color={colors.amberLight} size={18} />
          <Text style={styles.filterTitle}>Keep search local</Text>
          <Switch
            value={localOnly}
            onValueChange={setLocalOnly}
            trackColor={{ false: colors.borderMuted, true: colors.amber }}
            thumbColor={localOnly ? colors.amberLight : colors.textDim}
          />
        </View>
        {localOnly && (
          <>
            <Text style={styles.hint}>City, ZIP, or region — we'll prioritize nearby contacts.</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Austin, TX or 78701"
              placeholderTextColor={colors.textDim}
              value={location}
              onChangeText={setLocation}
            />
            <Text style={styles.hint}>Search radius (30–100 miles)</Text>
            <View style={styles.radiusRow}>
              {['30', '50', '75', '100'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, radiusMiles === r && styles.radiusChipOn]}
                  onPress={() => setRadiusMiles(r)}
                >
                  <Text style={[styles.radiusText, radiusMiles === r && styles.radiusTextOn]}>{r} mi</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </GlassCard>

      <TouchableOpacity style={styles.runBtn} onPress={() => void runResearch()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.runBtnText}>{summary ? 'Refresh research' : 'Run company research'}</Text>
        )}
      </TouchableOpacity>

      {!!summary && (
        <>
          <Text style={styles.sectionTitle}>Company summary</Text>
          <GlassCard style={styles.card}>
            <Text style={styles.body}>{summary}</Text>
          </GlassCard>
        </>
      )}

      <Text style={styles.sectionTitle}>Contacts</Text>
      {contacts.length === 0 ? (
        <Text style={styles.empty}>No contacts yet — run research to find emails and phone numbers.</Text>
      ) : (
        contacts.map((c, i) => (
          <View key={`${c.name}-${i}`} style={styles.contactCard}>
            <Text style={styles.contactName}>{c.name || 'Contact'}</Text>
            <Text style={styles.contactRole}>{c.role || 'Role unknown'}</Text>
            {!!c.email && <Text style={styles.contactDetail}>✉ {c.email}</Text>}
            {!!c.phone && <Text style={styles.contactDetail}>☎ {c.phone}</Text>}
            <View style={styles.actionRow}>
              {!!c.email && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => void handleEmail(c.email!)}>
                  <Mail color={colors.black} size={16} />
                  <Text style={styles.actionText}>Email</Text>
                </TouchableOpacity>
              )}
              {!!c.phone && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.callBtn]}
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
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  filterCard: { padding: spacing.md, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  filterTitle: { color: colors.text, fontWeight: '800', flex: 1, fontSize: 15 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 6, lineHeight: 17 },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  radiusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radiusChip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  radiusChipOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  radiusText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  radiusTextOn: { color: colors.black },
  runBtn: {
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  runBtnText: { color: colors.black, fontWeight: '800', fontSize: 15 },
  sectionTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  card: { padding: spacing.md, marginBottom: spacing.md },
  body: { color: colors.text, lineHeight: 22, fontSize: 15 },
  empty: { color: colors.textMuted, marginBottom: spacing.lg },
  contactCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactName: { color: colors.text, fontWeight: '800', fontSize: 16 },
  contactRole: { color: colors.textMuted, marginTop: 2, marginBottom: 6 },
  contactDetail: { color: colors.amberLight, fontSize: 14, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: colors.amber,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    gap: 6,
  },
  callBtn: { backgroundColor: colors.amberLight },
  actionText: { color: colors.black, fontWeight: '800', fontSize: 12 },
});
