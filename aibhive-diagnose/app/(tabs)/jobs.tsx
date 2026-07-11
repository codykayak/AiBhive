import * as Haptics from 'expo-haptics';
import { Briefcase, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import { syncJobsFromPros } from '@/lib/jobs/prosSync';
import {
  deleteJob,
  loadJobs,
  newJob,
  upsertJob,
  type FieldJob,
  type JobStatus,
} from '@/lib/jobs/storage';

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: 'Queued',
  in_progress: 'In progress',
  needs_parts: 'Needs parts',
  done: 'Done',
};

export default function JobsScreen() {
  const { activePack } = usePack();
  const { getIdToken, user } = useAuth();
  const [jobs, setJobs] = useState<FieldJob[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftAddress, setDraftAddress] = useState('');
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getIdToken();
    if (token) {
      setSyncing(true);
      try {
        setJobs(await syncJobsFromPros(token));
      } finally {
        setSyncing(false);
      }
    } else {
      setJobs(await loadJobs());
    }
  }, [getIdToken]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const addJob = async () => {
    if (!draftTitle.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const job = newJob({
      title: draftTitle.trim(),
      address: draftAddress.trim() || 'Address TBD',
      packId: activePack.id,
      status: 'queued',
    });
    const next = await upsertJob(job);
    setJobs(next);
    setDraftTitle('');
    setDraftAddress('');
  };

  const cycleStatus = async (job: FieldJob) => {
    const order: JobStatus[] = ['queued', 'in_progress', 'needs_parts', 'done'];
    const nextStatus = order[(order.indexOf(job.status) + 1) % order.length];
    const next = await upsertJob({ ...job, status: nextStatus, updatedAt: Date.now() });
    setJobs(next);
    void Haptics.selectionAsync();
  };

  const remove = (job: FieldJob) => {
    Alert.alert('Delete job?', job.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteJob(job.id).then(setJobs);
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-hive-mist">Jobs</Text>
          <Text className="mt-1 text-base text-hive-steel">
            {user
              ? 'Synced from Pros dispatch. Tap a card for notes & photos.'
              : `Local stops · sign in to sync with Pros. Defaults to ${activePack.shortName}.`}
          </Text>
        </View>
        <Pressable
          onPress={() => void refresh()}
          className="h-11 w-11 items-center justify-center rounded-xl border border-hive-border bg-hive-elevated"
        >
          <RefreshCw color={theme.colors.amber} size={18} />
        </Pressable>
      </View>
      {syncing ? <Text className="mt-2 text-xs text-hive-steel">Syncing with Pros…</Text> : null}

      <View className="mt-5 rounded-2xl border border-hive-border bg-hive-elevated p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">New job</Text>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="What’s broken?"
          placeholderTextColor={theme.colors.steel}
          className="min-h-[52px] rounded-xl border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
        />
        <TextInput
          value={draftAddress}
          onChangeText={setDraftAddress}
          placeholder="Address"
          placeholderTextColor={theme.colors.steel}
          className="mt-2 min-h-[48px] rounded-xl border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
        />
        <View className="mt-3">
          <BigButton
            label="Add job"
            icon={<Plus color={theme.colors.bg} size={22} strokeWidth={2.5} />}
            onPress={() => void addJob()}
            disabled={!draftTitle.trim()}
          />
        </View>
      </View>

      <View className="mt-6 gap-3">
        {jobs.map((job) => (
          <Pressable
            key={job.id}
            onPress={() => router.push(`/job/${job.id}` as never)}
            className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-4 active:opacity-80"
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  void cycleStatus(job);
                }}
                className="flex-row items-center gap-2 rounded-full bg-hive-amber/15 px-3 py-1"
              >
                <Briefcase color={theme.colors.amber} size={14} strokeWidth={2.4} />
                <Text className="text-xs font-bold uppercase tracking-wide text-hive-amber">
                  {STATUS_LABEL[job.status]}
                </Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  remove(job);
                }}
                hitSlop={8}
              >
                <Trash2 color={theme.colors.steel} size={18} />
              </Pressable>
            </View>
            <Text className="text-lg font-bold text-hive-mist">{job.title}</Text>
            <View className="mt-2 flex-row items-center gap-2">
              <MapPin color={theme.colors.steel} size={16} />
              <Text className="text-sm text-hive-steel">{job.address}</Text>
            </View>
            <Text className="mt-1 text-xs text-hive-steel">
              {job.packId === 'pool' ? 'Pool Services' : 'Electrical'} Pack
              {job.cloudSynced ? ' · Pros' : ''}
              {job.fieldNotes?.length ? ` · ${job.fieldNotes.length} notes` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
