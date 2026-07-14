import { Image, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

const APP_ICON = require('../icon.png');

type ProsBrandLogoProps = {
  /** `header` = compact icon + wordmark; `hero` / `intro` = app icon only; `hero-text` = wordmark only */
  variant?: 'header' | 'hero' | 'intro' | 'hero-text';
  dark?: boolean;
  style?: ViewStyle;
};

/**
 * AiBhive Pros branding — hero/intro use icon.png only; header keeps compact wordmark.
 */
export function ProsBrandLogo({ variant = 'header', dark = false, style }: ProsBrandLogoProps) {
  const hiveColor = dark ? '#FFFFFF' : theme.colors.mist;
  const prosColor = dark ? '#94A3B8' : theme.colors.steel;
  const hiveSize = variant === 'intro' ? 32 : variant === 'hero' ? 28 : 18;
  const prosSize = variant === 'intro' ? 18 : variant === 'hero' ? 16 : 13;
  const iconSize = variant === 'intro' ? 96 : variant === 'hero' ? 72 : 32;
  const iconRadius = variant === 'intro' ? 22 : variant === 'hero' ? 16 : 8;
  const iconOnly = variant === 'hero' || variant === 'intro';
  const textOnly = variant === 'hero-text';

  if (textOnly) {
    return (
      <View style={style} accessibilityRole="header" accessibilityLabel="AiBhive Pros">
        <Text style={[styles.hive, { color: hiveColor, fontSize: 30 }]}>
          AiB<Text style={{ color: theme.colors.amber }}>hive</Text>
          <Text style={[styles.pros, { color: prosColor, fontSize: 22 }]}> Pros</Text>
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.row, variant === 'intro' ? styles.introRow : null, style]}
      accessibilityRole="header"
      accessibilityLabel="AiBhive Pros"
    >
      <Image
        source={APP_ICON}
        style={{ width: iconSize, height: iconSize, borderRadius: iconRadius }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {!iconOnly ? (
        <View style={styles.textRow}>
          <Text style={[styles.hive, { color: hiveColor, fontSize: hiveSize }]}>
            AiB<Text style={{ color: theme.colors.amber }}>hive</Text>
          </Text>
          <Text style={[styles.pros, { color: prosColor, fontSize: prosSize }]}> Pros</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  introRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  textRow: {
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
