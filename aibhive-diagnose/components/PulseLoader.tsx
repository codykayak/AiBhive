import { Text, View } from 'react-native';

import { theme } from '@/constants/theme';

/** Simple loader without Reanimated — safe on every Expo Go build. */
export function PulseLoader({ text = 'Diagnosing…' }: { text?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.amber }} />
        <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.pool }} />
        <View
          style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.electrical }}
        />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.mist }}>{text}</Text>
    </View>
  );
}
