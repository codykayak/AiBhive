import { Waves, Wrench, Zap } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { TradePack } from '@/lib/packs';
import { theme } from '@/constants/theme';
import { packIconComponent } from '@/lib/packs/icons';

export function PackBadge({ pack, compact = false }: { pack: TradePack; compact?: boolean }) {
  const Icon = packIconComponent(pack);

  return (
    <View
      className={`flex-row items-center gap-2 rounded-full border px-3 ${compact ? 'py-1' : 'py-1.5'}`}
      style={{ borderColor: pack.accentColor, backgroundColor: `${pack.accentColor}22` }}
    >
      <Icon color={pack.accentColor} size={compact ? 14 : 16} strokeWidth={2.5} />
      <Text className="font-semibold text-hive-mist" style={{ fontSize: compact ? 12 : 13 }}>
        {pack.shortName} Pack
      </Text>
    </View>
  );
}

export function PackIcon({ pack, size = 28 }: { pack: TradePack; size?: number }) {
  const Icon = packIconComponent(pack);
  return <Icon color={pack.accentColor || theme.colors.amber} size={size} strokeWidth={2.4} />;
}

/** Keep lucide named exports available for older imports. */
export { Waves, Zap, Wrench };
