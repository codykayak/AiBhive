import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/colors';

type DorkLink = { label: string; url: string };

export function parseDorkLinks(data?: string): DorkLink[] {
  if (!data) return [];
  const links: DorkLink[] = [];
  const blocks = data.split(/\n\n+/);
  for (const block of blocks) {
    const labelMatch = block.match(/^\d+\.\s*(.+)/m);
    const urlMatch = block.match(/Open(?: in browser)?:\s*(https:\/\/[^\s]+)/);
    if (urlMatch) {
      links.push({
        label: labelMatch?.[1]?.split('\n')[0]?.trim() ?? 'Dork query',
        url: urlMatch[1],
      });
    }
  }
  return links;
}

type Props = {
  data?: string;
};

export function IntelDorkLinks({ data }: Props) {
  const links = parseDorkLinks(data);
  if (!links.length) return null;

  const open = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could not open browser'));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Open dorks in browser</Text>
      <Text style={styles.hint}>AiBhive never scrapes Google — these open in your browser safely.</Text>
      {links.map((link) => (
        <TouchableOpacity key={link.url} style={styles.row} onPress={() => open(link.url)}>
          <ExternalLink color={colors.amber} size={16} />
          <Text style={styles.label} numberOfLines={2}>
            {link.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { color: colors.amberLight, fontWeight: '800', fontSize: 14, marginBottom: 4 },
  hint: { color: colors.textDim, fontSize: 12, marginBottom: spacing.sm, lineHeight: 17 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    marginBottom: 6,
  },
  label: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '600' },
});
