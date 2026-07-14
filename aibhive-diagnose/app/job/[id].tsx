import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { Camera, MapPin, Send, Stethoscope } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { uploadProsImage } from '@/lib/diagnose/upload';
import { setProsLocationJobContext } from '@/lib/location/prosLocationTracker';
import { formatJobScheduleLabel } from '@/lib/jobs/schedule';
import { pushJobNoteToPros, pushJobPhotoToPros, pushJobStatusToPros } from '@/lib/jobs/prosSync';
import { loadJobs, upsertJob, type FieldJob, type JobStatus } from '@/lib/jobs/storage';

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: 'Queued',
  in_progress: 'In progress',
  needs_parts: 'Needs parts',
  done: 'Done',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getIdToken, user } = useAuth();
  const [job, setJob] = useState<FieldJob | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const jobs = await loadJobs();
    setJob(jobs.find((j) => j.id === id) || null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      setProsLocationJobContext(id);
      return () => setProsLocationJobContext(null);
    }, [reload, id])
  );

  if (!job) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-hive-mist">Job not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-hive-amber font-bold">Back</Text>
        </Pressable>
      </View>
    );
  }

  const cycleStatus = async () => {
    const order: JobStatus[] = ['queued', 'in_progress', 'needs_parts', 'done'];
    const status = order[(order.indexOf(job.status) + 1) % order.length];
    const markingDone = status === 'done' && job.status !== 'done';
    const next = { ...job, status, updatedAt: Date.now() };
    await upsertJob(next);
    setJob(next);
    void Haptics.selectionAsync();
    const token = await getIdToken();
    if (token && next.cloudSynced) {
      const cloud = await pushJobStatusToPros(token, next.id, status);
      if (cloud) setJob(cloud);
    }
    if (markingDone) {
      Alert.alert(
        'Share this fix?',
        'Add a one-line tip for your shop knowledge base (optional).',
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: 'Add tip',
            onPress: () => setNote('Fix: '),
          },
        ]
      );
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const fieldNote = {
        id: `n-${Date.now()}`,
        text: note.trim(),
        authorUid: user?.uid,
        createdAt: Date.now(),
      };
      const next: FieldJob = {
        ...job,
        fieldNotes: [...(job.fieldNotes || []), fieldNote],
        updatedAt: Date.now(),
      };
      await upsertJob(next);
      setJob(next);
      setNote('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const token = await getIdToken();
      if (token && job.cloudSynced) {
        const cloud = await pushJobNoteToPros(token, job.id, fieldNote.text);
        if (cloud) setJob(cloud);
      }
    } finally {
      setBusy(false);
    }
  };

  const addPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to attach job-site photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const localUrl = asset.uri;
    const photo = {
      id: `p-${Date.now()}`,
      url: localUrl,
      caption: '',
      createdAt: Date.now(),
    };
    const next: FieldJob = {
      ...job,
      photos: [...(job.photos || []), photo],
      updatedAt: Date.now(),
    };
    await upsertJob(next);
    setJob(next);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const token = await getIdToken();
    if (token && job.cloudSynced && asset.base64) {
      const uploaded = await uploadProsImage(
        token,
        asset.base64,
        asset.mimeType || 'image/jpeg',
        `jobs/${job.id}`
      );
      const photoUrl = uploaded?.url || localUrl;
      const cloud = await pushJobPhotoToPros(token, job.id, photoUrl);
      if (cloud) setJob(cloud);
      else if (uploaded?.url) {
        const withUrl: FieldJob = {
          ...next,
          photos: (next.photos || []).map((p) =>
            p.id === photo.id ? { ...p, url: uploaded.url } : p
          ),
        };
        await upsertJob(withUrl);
        setJob(withUrl);
      }
    }
  };

  const openDiagnose = () => {
    const prompt = [job.title, job.notes, job.adminNotes].filter(Boolean).join(' — ').slice(0, 280);
    router.push({
      pathname: '/diagnose-session',
      params: { prompt, jobId: job.id },
    });
  };

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Pressable
        onPress={() => void cycleStatus()}
        className="self-start rounded-full border border-hive-border bg-hive-card px-3 py-1.5"
      >
        <Text className="text-xs font-bold uppercase tracking-wider text-hive-amber">
          {STATUS_LABEL[job.status]} · tap to advance
        </Text>
      </Pressable>

      <Text className="mt-4 text-2xl font-bold text-hive-mist">{job.title}</Text>
      <View className="mt-2 flex-row items-center gap-2">
        <MapPin color={theme.colors.steel} size={16} />
        <Text className="text-base text-hive-steel">{job.address || 'Address TBD'}</Text>
      </View>
      {formatJobScheduleLabel(job) ? (
        <Text className="mt-2 text-sm font-semibold text-hive-amber">
          Scheduled · {formatJobScheduleLabel(job)}
        </Text>
      ) : null}

      {job.adminNotes ? (
        <View className="mt-4 rounded-sm border border-hive-border bg-hive-elevated px-4 py-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-hive-amber">From dispatch</Text>
          <Text className="mt-1 text-sm text-hive-mist">{job.adminNotes}</Text>
        </View>
      ) : null}

      {job.notes ? (
        <Text className="mt-4 text-sm leading-5 text-hive-steel">{job.notes}</Text>
      ) : null}

      <View className="mt-6">
        <BigButton
          label="Diagnose this job"
          subtitle="Open chat with job context — result saves as a note"
          icon={<Stethoscope color={theme.colors.onPrimary} size={22} />}
          onPress={openDiagnose}
        />
      </View>

      <View className="mt-8">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">
          Site notes
        </Text>
        {(job.fieldNotes || []).map((n) => (
          <View key={n.id} className="mb-2 rounded-sm border border-hive-border bg-hive-card px-4 py-3">
            <Text className="text-sm text-hive-mist">{n.text}</Text>
            <Text className="mt-1 text-[11px] text-hive-steel">
              {new Date(n.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened on site?"
          placeholderTextColor={theme.colors.steel}
          multiline
          className="min-h-[88px] rounded-sm border border-hive-border bg-hive-elevated px-4 py-3 text-base text-hive-mist"
        />
        <View className="mt-3">
          <BigButton
            label={busy ? 'Saving…' : 'Save note'}
            icon={<Send color={theme.colors.onPrimary} size={22} />}
            onPress={() => void addNote()}
          />
        </View>
      </View>

      <View className="mt-8">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">Photos</Text>
        <View className="flex-row flex-wrap gap-3">
          {(job.photos || []).map((p) => (
            <Image
              key={p.id}
              source={{ uri: p.url }}
              style={{ width: 96, height: 96, borderRadius: 14 }}
            />
          ))}
        </View>
        <View className="mt-3">
          <BigButton
            label="Add site photo"
            variant="secondary"
            icon={<Camera color={theme.colors.amber} size={22} />}
            onPress={() => void addPhoto()}
          />
        </View>
      </View>
    </ScrollView>
  );
}
