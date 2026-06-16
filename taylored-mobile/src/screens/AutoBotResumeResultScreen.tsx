import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Copy, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';
import { getActiveLlmConfig, generateWithParts } from '../lib/ai';
import { mimeTypeForUri, readUriAsBase64 } from '../lib/files';
import { scrapeJobPosting } from '../lib/jobIntel';

function extractSection(text: string, start: string, end?: string) {
  const pattern = end
    ? new RegExp(`\\[${start}\\]([\\s\\S]*?)\\[${end}\\]`, 'i')
    : new RegExp(`\\[${start}\\]([\\s\\S]*)`, 'i');
  const match = text.match(pattern);
  return match?.[1]?.trim() || '';
}

export default function AutoBotResumeResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { name, email, phone, history, jobUrl, resumeUri, jobImages } = route.params;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Preparing your application kit...');
  const [coverLetter, setCoverLetter] = useState('');
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [coldEmail, setColdEmail] = useState('');
  const [extractedJobDetails, setExtractedJobDetails] = useState('');

  useEffect(() => {
    generateApplication();
  }, []);

  const generateApplication = async () => {
    try {
      const config = await getActiveLlmConfig();
      if (!config) {
        Alert.alert('API key required', 'Enable a provider in Settings, add an API key, and set it active.');
        setLoading(false);
        return;
      }

      setStatus('Reading job listing...');
      const scrapedJob = jobUrl ? await scrapeJobPosting(jobUrl) : null;

      const contentParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

      const prompt = `
You are an elite career coach and recruiter working for AiBhive.

Candidate:
- Name: ${name}
- Email: ${email || 'not provided'}
- Phone: ${phone || 'not provided'}
- Additional notes: ${history || 'none'}

Job source:
${scrapedJob ? `Scraped job posting content:\n${scrapedJob}` : 'Use the attached job listing screenshots.'}
${jobUrl ? `Original URL: ${jobUrl}` : ''}

Return exactly four sections with these headers in ALL CAPS brackets:

[JOB DETAILS]
Extract company name, role title, requirements, and keywords from the listing.

[COVER LETTER]
Write a persuasive, role-specific cover letter in first person.

[REWRITTEN RESUME]
Rewrite the resume content to match this role. Use concise bullet points and measurable outcomes.

[COLD EMAIL]
Write a 3-sentence outreach email to a hiring manager or recruiter.
`;
      contentParts.push(prompt);

      if (resumeUri) {
        const base64Data = await readUriAsBase64(resumeUri);
        if (base64Data) {
          contentParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeTypeForUri(resumeUri),
            },
          });
        }
      }

      for (const uri of jobImages || []) {
        const base64Data = await readUriAsBase64(uri);
        if (base64Data) {
          contentParts.push({
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          });
        }
      }

      setStatus(`Drafting with ${config.providerLabel}…`);
      const text = await generateWithParts(config, prompt, contentParts);

      setExtractedJobDetails(extractSection(text, 'JOB DETAILS', 'COVER LETTER') || 'Could not parse job details.');
      setCoverLetter(extractSection(text, 'COVER LETTER', 'REWRITTEN RESUME') || 'Could not parse cover letter.');
      setRewrittenResume(extractSection(text, 'REWRITTEN RESUME', 'COLD EMAIL') || 'Could not parse resume rewrite.');
      setColdEmail(extractSection(text, 'COLD EMAIL') || text);
    } catch (error) {
      console.error(error);
      Alert.alert('Generation failed', 'Check your API keys and try again with a clearer job listing.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, title: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${title} copied to clipboard.`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.amberLight} />
        <Text style={styles.loadingText}>{status}</Text>
      </View>
    );
  }

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <Text style={styles.pageTitle}>Your Application Kit</Text>
        <Text style={styles.pageSubtitle}>Copy any section into the employer site or your email app.</Text>

        <Section title="Job Details" text={extractedJobDetails} />
        <Section title="Cover Letter" text={coverLetter} onCopy={() => copyText(coverLetter, 'Cover letter')} />
        <Section title="Tailored Resume" text={rewrittenResume} onCopy={() => copyText(rewrittenResume, 'Resume')} />
        <Section title="Cold Outreach Email" text={coldEmail} onCopy={() => copyText(coldEmail, 'Cold email')} />

        <PrimaryButton
          label="Find Decision Makers"
          onPress={() => navigation.navigate('Deeper', { companyDetails: extractedJobDetails, coldEmail })}
          style={styles.deeperButton}
        />
        <TouchableOpacity style={styles.deeperHint} onPress={() => navigation.navigate('Deeper', { companyDetails: extractedJobDetails, coldEmail })}>
          <Text style={styles.deeperHintText}>Requires Firecrawl API key for web research</Text>
          <ChevronRight color={colors.amber} size={18} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

function Section({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy} style={styles.iconButton}>
            <Copy color={colors.amberLight} size={18} />
          </TouchableOpacity>
        )}
      </View>
      <GlassCard>
        <Text style={styles.text}>{text}</Text>
      </GlassCard>
    </View>
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
  loadingText: { color: colors.amberLight, marginTop: spacing.md, textAlign: 'center', lineHeight: 22 },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  pageSubtitle: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  section: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: colors.amberLight, fontSize: 16, fontWeight: '800' },
  iconButton: { padding: 6 },
  text: { color: colors.text, fontSize: 15, lineHeight: 23 },
  deeperButton: { marginTop: spacing.md },
  deeperHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  deeperHintText: { color: colors.textDim, fontSize: 12 },
});
