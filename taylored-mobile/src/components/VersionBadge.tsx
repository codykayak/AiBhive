import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APP_VERSION } from '../constants/version';
import { colors, radii } from '../theme/colors';

export function VersionBadge({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>v{APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 8,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    opacity: 0.75,
  },
  text: {
    color: colors.amberLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textCompact: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
  },
});
