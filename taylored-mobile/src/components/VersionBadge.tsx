import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APP_VERSION } from '../constants/version';
import { colors, radii } from '../theme/colors';

export function VersionBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>v{APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 8,
  },
  text: {
    color: colors.amberLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
