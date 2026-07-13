import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { theme } from '@/constants/theme';

type BigButtonProps = PressableProps & {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  accentColor?: string;
};

export function BigButton({
  label,
  subtitle,
  icon,
  variant = 'primary',
  accentColor,
  disabled,
  onPress,
  ...rest
}: BigButtonProps) {
  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : variant === 'danger'
          ? styles.danger
          : styles.ghost;

  const labelStyle =
    variant === 'primary' ? styles.labelPrimary : variant === 'danger' ? styles.labelLight : styles.labelLight;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
      }}
      style={[
        styles.base,
        variantStyle,
        disabled ? styles.disabled : null,
        accentColor && variant === 'primary' ? { backgroundColor: accentColor } : null,
      ]}
      {...rest}
    >
      {icon ? <View>{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const R = theme.radius;

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: R.sm,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primary: {
    backgroundColor: theme.colors.amber,
  },
  secondary: {
    backgroundColor: theme.colors.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
  labelPrimary: {
    color: theme.colors.onPrimary,
  },
  labelLight: {
    color: theme.colors.mist,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: theme.colors.steel,
  },
});
