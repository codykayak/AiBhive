import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Copy, ChevronRight, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { CompanyResearchPanel } from '../components/CompanyResearchPanel';
import { GlassCard } from '../components/ui';
import { getJob, statusLabel, updateJob, type JobApplication, type JobStatus } from '../lib/jobs';
import { colors, radii, spacing } from '../theme/colors';

const STATUS_OPTIONS: JobStatus[] = ['draft', 'generated', 'submitted', 'interviewing', 'rejected', 'offer'];
type TabId = 'overview' | 'application' | 'research';

export default function JobDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const jobId = route.params?.jobId as string;
  const initialTab = (route.params?.tab as TabId) || 'overview';

  const [job, setJob] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>(initialTab);

  const load = useCallback(async () => {
    setLoading(true);
    setJob(await getJob(jobId));
    setLoading(false);
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied.`);
  };

  const setStatus = async (status: JobStatus) => {
    const updated = await updateJob(jobId, { status });
    if (updated) setJob(updated);
  };

  if (loading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amberLight} size="large" />
      </View>
    );
  }

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.content}>
      <Text style={styles.title}>{job.companyName || 'Job application'}</Text>
      <Text style={styles.subtitle}>{job.roleTitle || job.jobUrl || job.candidateName}</Text>

      <View style={styles.tabRow}>
        {(
          [
            ['overview', 'Overview'],
            ['application', 'Application'],
            ['research', 'Research'],
          ] as const
        ).map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, tab === id && styles.tabOn]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'overview' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, job.status === s && styles.statusChipOn]}
                onPress={() => void setStatus(s)}
              >
                <Text style={[styles.statusChipText, job.status === s && styles.statusChipTextOn]}>
                  {statusLabel(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!!job.notes && (
            <GlassCard style={styles.block}>
              <Text style={styles.blockTitle}>Your notes</Text>
              <Text style={styles.blockText}>{job.notes}</Text>
            </GlassCard>
          )}

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() =>
              navigation.navigate('AutoBotResumeResult', {
                jobId: job.id,
                name: job.candidateName,
                email: job.email,
                phone: job.phone,
                history: job.notes,
                jobUrl: job.jobUrl,
                resumeUri: job.resumeUri,
                jobImages: job.screenshotUris,
                regenerate: true,
              })
            }
          >
            <Search color={colors.amberLight} size={18} />
            <Text style={styles.linkText}>Regenerate application kit</Text>
            <ChevronRight color={colors.amber} size={18} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab === 'application' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
          <MaterialBlock title="Job details" text={job.jobDetails} onCopy={() => copyText(job.jobDetails || '', 'Job details')} />
          <MaterialBlock title="Cover letter" text={job.coverLetter} onCopy={() => copyText(job.coverLetter || '', 'Cover letter')} />
          <MaterialBlock title="Tailored resume" text={job.rewrittenResume} onCopy={() => copyText(job.rewrittenResume || '', 'Resume')} />
          <MaterialBlock title="Cold email" text={job.coldEmail} onCopy={() => copyText(job.coldEmail || '', 'Cold email')} />
        </ScrollView>
      )}

      {tab === 'research' && <CompanyResearchPanel job={job} onUpdated={setJob} />}
    </ScreenLayout>
  );
}

function MaterialBlock({
  title,
  text,
  onCopy,
}: {
  title: string;
  text?: string;
  onCopy?: () => void;
}) {
  if (!text?.trim()) return null;
  return (
    <GlassCard style={styles.block}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockTitle}>{title}</Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
            <Copy color={colors.amberLight} size={16} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.blockText}>{text}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  tabText: { color: colors.textMuted, fontWeight: '800', fontSize: 13 },
  tabTextOn: { color: colors.black },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  statusRow: { marginBottom: spacing.md },
  statusChip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  statusChipOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  statusChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  statusChipTextOn: { color: colors.black },
  block: { marginBottom: spacing.md, padding: spacing.md },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  blockTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15 },
  copyBtn: { padding: 4 },
  blockText: { color: colors.text, lineHeight: 22, fontSize: 15 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  linkText: { color: colors.amberLight, fontWeight: '700', flex: 1 },
});
