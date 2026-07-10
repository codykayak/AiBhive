import * as Haptics from 'expo-haptics';
import { Pressable, Text, View, type PressableProps } from 'react-native';

type BigButtonProps = PressableProps & {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  accentColor?: string;
};

const variantClasses = {
  primary: 'bg-hive-amber',
  secondary: 'bg-hive-card border border-hive-border',
  ghost: 'bg-transparent border border-hive-border',
  danger: 'bg-hive-danger',
} as const;

const labelClasses = {
  primary: 'text-hive-bg',
  secondary: 'text-hive-mist',
  ghost: 'text-hive-mist',
  danger: 'text-hive-mist',
} as const;

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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
      }}
      className={`min-h-[56px] flex-row items-center justify-center gap-3 rounded-2xl px-5 py-4 active:opacity-80 ${variantClasses[variant]} ${disabled ? 'opacity-40' : ''}`}
      style={accentColor && variant === 'primary' ? { backgroundColor: accentColor } : undefined}
      {...rest}
    >
      {icon ? <View>{icon}</View> : null}
      <View className="flex-1">
        <Text className={`text-lg font-bold ${labelClasses[variant]}`}>{label}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-hive-steel">{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}
