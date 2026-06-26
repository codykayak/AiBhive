import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HiveLogo } from './HiveLogo';
import { HOME_INTRO_TAGLINE } from './HomeHeroVideo';
import { colors, radii, spacing } from '../theme/colors';

/**
 * Static hero shown after the intro video finishes (or on return visits).
 */
export function HomeHeroBanner() {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <HiveLogo size={72} />
        <Text style={styles.brand}>AiBhive</Text>
        <Text style={styles.tagline}>{HOME_INTRO_TAGLINE}</Text>
        <Text style={styles.hint}>Type below or tap the assistant to open full chat</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  inner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.amber + '33',
    backgroundColor: colors.bgElevated + 'cc',
  },
  brand: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 0.4,
    marginTop: spacing.md,
  },
  tagline: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
