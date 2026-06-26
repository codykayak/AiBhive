import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/colors';
import {
  addJobFollowUpEvent,
  formatFollowUpDate,
  type FollowUpPreset,
} from '../lib/calendarReminders';

type Props = {
  visible: boolean;
  companyName: string;
  roleTitle?: string;
  onClose: () => void;
  onAdded?: () => void;
};

const PRESETS: FollowUpPreset[] = [3, 7, 14];

export function CalendarFollowUpSheet({ visible, companyName, roleTitle, onClose, onAdded }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (days: FollowUpPreset) => {
    setBusy(true);
    setError(null);
    const result = await addJobFollowUpEvent({ companyName, roleTitle, daysFromNow: days });
    setBusy(false);
    if (result.ok) {
      onAdded?.();
      onClose();
      return;
    }
    setError(result.error);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Calendar color={colors.amber} size={22} />
            <Text style={styles.title}>Add follow-up reminder?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X color={colors.textDim} size={22} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Most replies come 5–7 days after applying. Pick when to follow up on{' '}
            <Text style={styles.strong}>{companyName}</Text>.
          </Text>

          {PRESETS.map((days) => (
            <TouchableOpacity
              key={days}
              style={styles.option}
              onPress={() => void add(days)}
              disabled={busy}
            >
              <Text style={styles.optionTitle}>{days} days</Text>
              <Text style={styles.optionSub}>{formatFollowUpDate(days)} · 9:00 AM</Text>
            </TouchableOpacity>
          ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {busy ? <ActivityIndicator color={colors.amber} style={{ marginTop: 8 }} /> : null}

          <TouchableOpacity style={styles.skip} onPress={onClose} disabled={busy}>
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  title: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 18 },
  subtitle: { color: colors.textMuted, lineHeight: 22, marginBottom: spacing.md },
  strong: { color: colors.amberLight, fontWeight: '700' },
  option: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  optionSub: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  error: { color: colors.danger, marginTop: spacing.sm, fontSize: 13 },
  skip: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textDim, fontWeight: '700' },
});
