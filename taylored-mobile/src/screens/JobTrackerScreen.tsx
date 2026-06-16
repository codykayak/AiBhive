import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Briefcase, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/ui';
import { listJobs, statusLabel, type JobApplication } from '../lib/jobs';
import { colors, radii, spacing } from '../theme/colors';

export default function JobTrackerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <ScreenLayout
      title="Job Tracker"
      subtitle="Every application you generate is saved here with materials and research."
      showBrand={false}
      contentStyle={styles.content}
    >
      <PrimaryButton
        label="New application"
        onPress={() => navigation.navigate('AutoBotResume')}
        style={styles.newBtn}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amberLight} />}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {jobs.length === 0 ? (
          <View style={styles.empty}>
            <Briefcase color={colors.textDim} size={40} />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptyText}>Generate an application kit and it will appear here automatically.</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            >
              <View style={styles.cardBody}>
                <Text style={styles.company}>{job.companyName || job.roleTitle || 'Untitled role'}</Text>
                <Text style={styles.role}>{job.roleTitle || job.jobUrl || 'Tap for details'}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{statusLabel(job.status)}</Text>
                  </View>
                  <Text style={styles.date}>{new Date(job.updatedAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <ChevronRight color={colors.amber} size={20} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  newBtn: { marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    gap: spacing.sm,
  },
  cardBody: { flex: 1 },
  company: { color: colors.text, fontSize: 17, fontWeight: '800' },
  role: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  statusPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  statusText: { color: colors.amberLight, fontSize: 11, fontWeight: '800' },
  date: { color: colors.textDim, fontSize: 12 },
});
