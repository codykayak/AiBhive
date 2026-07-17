import * as Haptics from 'expo-haptics';
import { Briefcase, CalendarDays, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import { syncJobsFromPros } from '@/lib/jobs/prosSync';
import {
  addDays,
  formatJobScheduleLabel,
  jobsOnDay,
  sameDay,
  sortJobsBySchedule,
  startOfWeek,
} from '@/lib/jobs/schedule';
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

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function packLabel(packId: FieldJob['packId']) {
  if (packId === 'pool') return 'Pool Services';
  if (packId === 'property') return 'Property Maintenance';
  if (packId === 'plumbing') return 'Plumbing';
  if (packId === 'hvac') return 'HVAC';
  if (packId === 'fiber') return 'Fiber Optics';
  return 'Electrical';
}

export default function JobsScreen() {
  const { activePack } = usePack();
  const { getIdToken, user } = useAuth();
  const [jobs, setJobs] = useState<FieldJob[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftAddress, setDraftAddress] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dayFilter, setDayFilter] = useState(false);

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
      setJobs(sortJobsBySchedule(await loadJobs()));
    }
  }, [getIdToken]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor]
  );

  const countsByDay = useMemo(() => {
    return weekDays.map((day) => jobsOnDay(jobs, day).length);
  }, [jobs, weekDays]);

  const visibleJobs = useMemo(() => {
    const ordered = sortJobsBySchedule(jobs);
    if (!dayFilter) return ordered;
    return jobsOnDay(ordered, selectedDay);
  }, [jobs, dayFilter, selectedDay]);

  const addJob = async () => {
    if (!draftTitle.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const job = newJob({
      title: draftTitle.trim(),
      address: draftAddress.trim() || 'Address TBD',
      packId: activePack.id,
      status: 'queued',
    });
    const next = sortJobsBySchedule(await upsertJob(job));
    setJobs(next);
    setDraftTitle('');
    setDraftAddress('');
  };

  const cycleStatus = async (job: FieldJob) => {
    const order: JobStatus[] = ['queued', 'in_progress', 'needs_parts', 'done'];
    const nextStatus = order[(order.indexOf(job.status) + 1) % order.length];
    const next = sortJobsBySchedule(
      await upsertJob({ ...job, status: nextStatus, updatedAt: Date.now() })
    );
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
          void deleteJob(job.id).then((list) => setJobs(sortJobsBySchedule(list)));
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
              ? 'Synced from Pros dispatch — ordered by schedule time.'
              : `Local stops · sign in to sync with Pros. Defaults to ${activePack.shortName}.`}
          </Text>
        </View>
        <Pressable
          onPress={() => void refresh()}
          className="h-11 w-11 items-center justify-center rounded-sm border border-hive-border bg-hive-elevated"
        >
          <RefreshCw color={theme.colors.amber} size={18} />
        </Pressable>
      </View>
      {syncing ? <Text className="mt-2 text-xs text-hive-steel">Syncing with Pros…</Text> : null}

      {/* Week calendar — lives on Jobs so techs see today’s stops first */}
      <View className="mt-5 rounded-sm border border-hive-border bg-hive-elevated p-3">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <CalendarDays color={theme.colors.amber} size={18} />
            <Text className="text-sm font-bold uppercase tracking-wider text-hive-amber">
              Schedule
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setWeekAnchor((w) => addDays(w, -7))}
              className="rounded-sm border border-hive-border px-2 py-1"
            >
              <Text className="text-xs font-semibold text-hive-steel">Prev</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setWeekAnchor(startOfWeek(today));
                setSelectedDay(today);
                setDayFilter(false);
              }}
              className="rounded-sm border border-hive-border px-2 py-1"
            >
              <Text className="text-xs font-semibold text-hive-steel">Today</Text>
            </Pressable>
            <Pressable
              onPress={() => setWeekAnchor((w) => addDays(w, 7))}
              className="rounded-sm border border-hive-border px-2 py-1"
            >
              <Text className="text-xs font-semibold text-hive-steel">Next</Text>
            </Pressable>
          </View>
        </View>
        <View className="flex-row justify-between gap-1">
          {weekDays.map((day, i) => {
            const selected = sameDay(day, selectedDay) && dayFilter;
            const isToday = sameDay(day, new Date());
            const count = countsByDay[i] || 0;
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => {
                  setSelectedDay(day);
                  setDayFilter(true);
                  void Haptics.selectionAsync();
                }}
                className="min-h-[64px] flex-1 items-center justify-center rounded-sm border px-1 py-2"
                style={{
                  borderColor: selected ? theme.colors.amber : theme.colors.border,
                  backgroundColor: selected ? 'rgba(245, 185, 66, 0.15)' : theme.colors.bg,
                }}
              >
                <Text className="text-[10px] font-bold uppercase text-hive-steel">{DOW[i]}</Text>
                <Text
                  className="mt-0.5 text-base font-bold"
                  style={{ color: isToday ? theme.colors.amber : theme.colors.mist }}
                >
                  {day.getDate()}
                </Text>
                <View
                  className="mt-1 h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: count > 0 ? theme.colors.amber : 'transparent',
                  }}
                />
                {count > 0 ? (
                  <Text className="mt-0.5 text-[9px] font-semibold text-hive-steel">{count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {dayFilter ? (
          <Pressable onPress={() => setDayFilter(false)} className="mt-3 self-start">
            <Text className="text-xs font-semibold text-hive-amber">Show all jobs</Text>
          </Pressable>
        ) : (
          <Text className="mt-3 text-xs text-hive-steel">
            Tap a day to filter · jobs without a Pros schedule still appear in All.
          </Text>
        )}
      </View>

      <View className="mt-5 rounded-sm border border-hive-border bg-hive-elevated p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">New job</Text>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="What’s broken?"
          placeholderTextColor={theme.colors.steel}
          className="min-h-[52px] rounded-sm border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
        />
        <TextInput
          value={draftAddress}
          onChangeText={setDraftAddress}
          placeholder="Address"
          placeholderTextColor={theme.colors.steel}
          className="mt-2 min-h-[48px] rounded-sm border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
        />
        <View className="mt-3">
          <BigButton
            label="Add job"
            icon={<Plus color={theme.colors.onOrange} size={22} strokeWidth={2.5} />}
            onPress={() => void addJob()}
            disabled={!draftTitle.trim()}
          />
        </View>
      </View>

      <View className="mt-6 gap-3">
        {visibleJobs.length === 0 ? (
          <Text className="text-sm text-hive-steel">
            {dayFilter ? 'No jobs scheduled this day.' : 'No jobs yet — sync from Pros or add one.'}
          </Text>
        ) : null}
        {visibleJobs.map((job) => {
          const when = formatJobScheduleLabel(job);
          return (
            <Pressable
              key={job.id}
              onPress={() => router.push(`/job/${job.id}` as never)}
              className="rounded-sm border border-hive-border bg-hive-elevated px-4 py-4 active:opacity-80"
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
              {when ? (
                <View className="mt-2 flex-row items-center gap-2">
                  <CalendarDays color={theme.colors.amber} size={16} />
                  <Text className="text-sm font-semibold text-hive-amber">{when}</Text>
                </View>
              ) : null}
              <View className="mt-2 flex-row items-center gap-2">
                <MapPin color={theme.colors.steel} size={16} />
                <Text className="text-sm text-hive-steel">{job.address}</Text>
              </View>
              <Text className="mt-1 text-xs text-hive-steel">
                {packLabel(job.packId)} Pack
                {job.cloudSynced ? ' · Pros' : ''}
                {job.fieldNotes?.length ? ` · ${job.fieldNotes.length} notes` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
