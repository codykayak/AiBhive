import { ExternalLink, FileSearch } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { openManualSearchLink, type ManualSearchLink } from '@/lib/knowledge/manualSearch';

type Props = {
  links: ManualSearchLink[];
  compact?: boolean;
};

export function ManualSearchLinks({ links, compact = false }: Props) {
  if (!links.length) return null;

  return (
    <View
      className={`mt-3 border-t border-hive-border pt-3 ${compact ? '' : 'rounded-sm border border-hive-border bg-hive-card p-3 mt-0'}`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <FileSearch color={theme.colors.brand} size={16} />
        <Text className="text-xs font-bold uppercase tracking-wider text-hive-brand">Manual search</Text>
      </View>
      <Text className="text-sm text-hive-steel leading-5 mb-3">
        No matching manual in your shop library. Try these PDF searches online:
      </Text>
      <View className="gap-2">
        {links.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => openManualSearchLink(link.googleUrl)}
            className="min-h-[48px] flex-row items-center gap-3 border border-hive-border bg-hive-elevated px-3 py-2.5 active:opacity-80"
            style={{ borderRadius: theme.radius.sm }}
          >
            <ExternalLink color={theme.colors.teal} size={18} />
            <View className="flex-1">
              <Text className="font-bold text-hive-mist text-sm">{link.label}</Text>
              <Text className="text-[11px] text-hive-steel mt-0.5" numberOfLines={1}>
                {link.query}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
