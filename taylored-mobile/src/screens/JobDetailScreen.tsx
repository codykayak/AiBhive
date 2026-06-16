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
import { Copy, Search, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { getJob, statusLabel, updateJob, type JobStatus } from '../lib/jobs';
import { colors, radii, spacing } from '../theme/colors';

const STATUS_OPTIONS: JobStatus[] = ['draft', 'generated', 'submitted', 'interviewing', 'rejected', 'offer'];

export default function JobDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const jobId = route.params?.jobId as string;
  const [job, setJob] = useState<Awaited<ReturnType<typeof getJob>>>(null);
  const [loading, setLoading] = useState(true);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{job.companyName || 'Job application'}</Text>
        <Text style={styles.subtitle}>{job.roleTitle || job.jobUrl || job.candidateName}</Text>

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

        <PrimaryButton
          label={job.companyIntelSummary ? 'View company research' : 'Run company research'}
          onPress={() =>
            navigation.navigate('Deeper', {
              jobId: job.id,
              companyDetails: job.jobDetails || job.companyName || '',
              coldEmail: job.coldEmail || '',
            })
          }
          style={styles.researchBtn}
        />

        {!!job.companyIntelSummary && (
          <GlassCard style={styles.block}>
            <Text style={styles.blockTitle}>Company intel</Text>
            <Text style={styles.blockText}>{job.companyIntelSummary}</Text>
          </GlassCard>
        )}

        <MaterialBlock title="Job details" text={job.jobDetails} onCopy={() => copyText(job.jobDetails || '', 'Job details')} />
        <MaterialBlock title="Cover letter" text={job.coverLetter} onCopy={() => copyText(job.coverLetter || '', 'Cover letter')} />
        <MaterialBlock title="Tailored resume" text={job.rewrittenResume} onCopy={() => copyText(job.rewrittenResume || '', 'Resume')} />
        <MaterialBlock title="Cold email" text={job.coldEmail} onCopy={() => copyText(job.coldEmail || '', 'Cold email')} />

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
  researchBtn: { marginBottom: spacing.md },
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
