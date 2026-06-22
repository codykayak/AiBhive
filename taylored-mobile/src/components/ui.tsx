import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

type ButtonProps = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: LucideIcon;
};

export function PrimaryButton({
  label,
  onPress,
  style,
  disabled,
  variant = 'primary',
  loading,
  icon: Icon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.black : colors.amberLight} />
      ) : (
        <View style={styles.btnRow}>
          {Icon && <Icon color={isPrimary ? colors.black : colors.amberLight} size={18} />}
          <Text
            style={[
              styles.label,
              isPrimary && styles.primaryLabel,
              !isPrimary && styles.secondaryLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function GlassCard({ children, style, glow }: { children: React.ReactNode; style?: ViewStyle; glow?: boolean }) {
  return (
    <View style={[styles.card, glow && styles.cardGlow, style]}>{children}</View>
  );
}

export function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function Tag({ label, color = 'amber' }: { label: string; color?: 'amber' | 'success' | 'info' | 'purple' }) {
  const palette = {
    amber: { bg: colors.amberSoft, text: colors.amberLight, border: colors.border },
    success: { bg: colors.successSoft, text: colors.success, border: 'rgba(52,211,153,0.35)' },
    info: { bg: colors.infoSoft, text: colors.info, border: 'rgba(56,189,248,0.35)' },
    purple: { bg: colors.purpleSoft, text: colors.purple, border: 'rgba(167,139,250,0.35)' },
  }[color];
  return (
    <View style={[styles.tag, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.tagText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({
  label,
  tone = 'amber',
}: {
  label: string;
  tone?: 'amber' | 'success' | 'danger' | 'info' | 'muted' | 'purple';
}) {
  const tones = {
    amber: { bg: colors.amberSoft, text: colors.amberLight },
    success: { bg: colors.successSoft, text: colors.success },
    danger: { bg: colors.dangerSoft, text: colors.danger },
    info: { bg: colors.infoSoft, text: colors.info },
    purple: { bg: colors.purpleSoft, text: colors.purple },
    muted: { bg: 'rgba(148,163,184,0.12)', text: colors.textMuted },
  }[tone];
  return (
    <View style={[styles.statusPill, { backgroundColor: tones.bg }]}>
      <Text style={[styles.statusText, { color: tones.text }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon color={colors.amberLight} size={36} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}

export function AppLauncherCard({
  title,
  desc,
  tag,
  icon: Icon,
  onPress,
  accent,
  style,
}: {
  title: string;
  desc: string;
  tag: string;
  icon: LucideIcon;
  onPress: () => void;
  accent?: 'amber' | 'purple' | 'info';
  style?: ViewStyle;
}) {
  const accentColor =
    accent === 'purple' ? colors.purple : accent === 'info' ? colors.info : colors.amberLight;
  const accentBg =
    accent === 'purple' ? colors.purpleSoft : accent === 'info' ? colors.infoSoft : colors.amberSoft;

  return (
    <TouchableOpacity style={[styles.appCard, style]} activeOpacity={0.88} onPress={onPress}>
      <View style={[styles.appIcon, { backgroundColor: accentBg, borderColor: colors.border }]}>
        <Icon color={accentColor} size={30} />
      </View>
      <View style={styles.appBody}>
        <View style={styles.appTitleRow}>
          <Text style={styles.appTitle}>{title}</Text>
          <Tag label={tag} color={accent === 'purple' ? 'purple' : accent === 'info' ? 'info' : 'amber'} />
        </View>
        <Text style={styles.appDesc} numberOfLines={2}>{desc}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.amber,
    ...shadows.amber,
  },
  secondary: {
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.55 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '800' },
  primaryLabel: { color: colors.black },
  secondaryLabel: { color: colors.amberLight },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardGlow: {
    borderColor: colors.borderStrong,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textDim,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '800' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptyBody: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  appBody: { flex: 1 },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  appTitle: { ...typography.h3, color: colors.text },
  appDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  chevron: { color: colors.amber, fontSize: 28, fontWeight: '300', marginRight: 4 },
});
