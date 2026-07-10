import { WifiOff } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useNetwork } from '@/contexts/NetworkContext';
import { theme } from '@/constants/theme';

export function OfflineIndicator() {
  const { isOnline, isInternetReachable } = useNetwork();
  const offline = !isOnline || isInternetReachable === false;

  if (!offline) return null;

  return (
    <View className="flex-row items-center justify-center gap-2 bg-hive-danger/90 px-4 py-2">
      <WifiOff color={theme.colors.mist} size={16} strokeWidth={2.5} />
      <Text className="text-sm font-semibold text-hive-mist">Offline — local pack guidance only</Text>
    </View>
  );
}
