import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import type { InfoConfig } from '../types';
import type { HiveBrand } from '../branding';
import { colors, radii, spacing } from '../../theme/colors';

interface Props {
  config: InfoConfig;
  brand: HiveBrand;
}

export default function InfoPage({ config, brand }: Props) {
  return (
    <View style={styles.wrap}>
      {config.body ? <Text style={styles.body}>{config.body}</Text> : null}

      {config.bullets?.length ? (
        <View style={styles.bullets}>
          {config.bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: brand.primary }]}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {config.links?.length ? (
        <View style={styles.links}>
          {config.links.map((l) => (
            <TouchableOpacity
              key={l.url}
              onPress={() => void Linking.openURL(l.url)}
              style={[styles.link, { borderColor: brand.primarySoft }]}
            >
              <ExternalLink color={brand.primaryText} size={16} />
              <Text style={[styles.linkLabel, { color: brand.primaryText }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 24 },
  bullets: { gap: spacing.xs },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  bulletText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 22 },
  links: { gap: spacing.xs, marginTop: spacing.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  linkLabel: { fontSize: 14, fontWeight: '700' },
});
