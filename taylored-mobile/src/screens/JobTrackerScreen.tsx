import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Briefcase, ChevronRight, Search, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppThemeShell, AppThemeScroll } from '../components/AppThemeShell';
import { builtInAppForThemeKey } from '../constants/builtInHiveApps';
import { EmptyState, PrimaryButton, StatusPill } from '../components/ui';
import { listJobs, statusLabel, type JobApplication, type JobStatus } from '../lib/jobs';
import { jobStatusTone } from '../lib/jobStatusUi';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

const FILTERS: Array<{ id: 'all' | JobStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'generated', label: 'Kit ready' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'interviewing', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
];

export default function JobTrackerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const theme = builtInAppForThemeKey('tracker')!;
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | JobStatus>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setJobs(await listJobs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (filter !== 'all') list = list.filter((j) => j.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          (j.companyName || '').toLowerCase().includes(q) ||
          (j.roleTitle || '').toLowerCase().includes(q) ||
          (j.jobUrl || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [jobs, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length };
    for (const j of jobs) c[j.status] = (c[j.status] || 0) + 1;
    return c;
  }, [jobs]);

  return (
    <AppThemeShell
      theme={theme}
      subtitle="Your application pipeline — every kit, status, and follow-up in one place."
    >
      <PrimaryButton
        label="New application"
        icon={Plus}
        onPress={() => navigation.navigate('AutoBotResume')}
        style={styles.newBtn}
      />

      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
        <Search color={theme.accentText} size={18} />
        <TextInput
          style={[styles.searchInput, { color: theme.accentText }]}
          placeholder="Search company or role…"
          placeholderTextColor={theme.accentText + '66'}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id] ?? 0;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                { borderColor: theme.primary + '55', backgroundColor: theme.surface },
                active && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, { color: theme.accentText + 'aa' }, active && styles.filterTextOn]}>
                {f.label}{count > 0 ? ` · ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AppThemeScroll
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={jobs.length === 0 ? 'No jobs yet' : 'No matches'}
            body={
              jobs.length === 0
                ? 'Generate an application kit and it lands here automatically.'
                : 'Try a different filter or search term.'
            }
            action={
              jobs.length === 0 ? (
                <PrimaryButton
                  label="Create application kit"
                  variant="secondary"
                  onPress={() => navigation.navigate('AutoBotResume')}
                  style={{ marginTop: 12 }}
                />
              ) : undefined
            }
          />
        ) : (
          filtered.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            >
              <View style={[styles.cardAccent, { backgroundColor: theme.primary }]} />
              <View style={styles.cardBody}>
                <Text style={[styles.company, { color: theme.accentText }]}>{job.companyName || job.roleTitle || 'Untitled role'}</Text>
                <Text style={[styles.role, { color: theme.accentText + '99' }]} numberOfLines={1}>
                  {job.roleTitle || job.jobUrl || 'Tap for details'}
                </Text>
                <View style={styles.metaRow}>
                  <StatusPill label={statusLabel(job.status)} tone={jobStatusTone(job.status)} />
                  <Text style={styles.date}>{new Date(job.updatedAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <ChevronRight color={theme.primary} size={22} />
            </TouchableOpacity>
          ))
        )}
      </AppThemeScroll>
    </AppThemeShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  newBtn: { marginBottom: spacing.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgInput,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  filterScroll: { marginBottom: spacing.md, maxHeight: 44 },
  filterRow: { gap: 8, paddingRight: spacing.md },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.bgCard,
  },
  filterChipOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  filterText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  filterTextOn: { color: colors.black },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    overflow: 'hidden',
    ...shadows.soft,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.amber,
  },
  cardBody: { flex: 1, padding: spacing.md },
  company: { ...typography.h3, color: colors.text },
  role: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  date: { color: colors.textDim, fontSize: 12 },
});
