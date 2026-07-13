import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

type ProsBrandLogoProps = {
  /** `header` matches aibhive.com/pros top-left; `hero` is larger for home splash. */
  variant?: 'header' | 'hero';
  dark?: boolean;
  style?: ViewStyle;
};

/**
 * Matches ProsPageHeader on aibhive.com/pros — AiB(hive) Pros wordmark.
 */
export function ProsBrandLogo({ variant = 'header', dark = false, style }: ProsBrandLogoProps) {
  const hiveColor = dark ? '#FFFFFF' : theme.colors.mist;
  const prosColor = dark ? '#94A3B8' : theme.colors.steel;
  const hiveSize = variant === 'hero' ? 28 : 18;
  const prosSize = variant === 'hero' ? 16 : 13;

  return (
    <View style={[styles.row, style]} accessibilityRole="header" accessibilityLabel="AiBhive Pros">
      <Text style={[styles.hive, { color: hiveColor, fontSize: hiveSize }]}>
        AiB<Text style={{ color: theme.colors.amber }}>hive</Text>
      </Text>
      <Text style={[styles.pros, { color: prosColor, fontSize: prosSize }]}> Pros</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  hive: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pros: {
    fontWeight: '700',
  } as TextStyle,
});
