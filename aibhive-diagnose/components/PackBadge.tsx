import { Waves, Wrench, Zap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { TradePack } from '@/lib/packs';
import { theme } from '@/constants/theme';
import { packIconComponent } from '@/lib/packs/icons';

export function PackBadge({ pack, compact = false }: { pack: TradePack; compact?: boolean }) {
  const Icon = packIconComponent(pack);

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.compact : styles.roomy,
        { borderColor: pack.accentColor, backgroundColor: `${pack.accentColor}22` },
      ]}
    >
      <Icon color={pack.accentColor} size={compact ? 14 : 16} strokeWidth={2.5} />
      <Text style={[styles.label, { fontSize: compact ? 12 : 13 }]}>{pack.shortName} Pack</Text>
    </View>
  );
}

export function PackIcon({ pack, size = 28 }: { pack: TradePack; size?: number }) {
  const Icon = packIconComponent(pack);
  return <Icon color={pack.accentColor || theme.colors.amber} size={size} strokeWidth={2.4} />;
}

export { Waves, Zap, Wrench };

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  compact: { paddingVertical: 4 },
  roomy: { paddingVertical: 6 },
  label: {
    fontWeight: '600',
    color: theme.colors.mist,
  },
});
