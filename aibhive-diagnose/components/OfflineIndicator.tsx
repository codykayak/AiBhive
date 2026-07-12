import { WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useNetwork } from '@/contexts/NetworkContext';
import { theme } from '@/constants/theme';

export function OfflineIndicator() {
  const { isOnline, isInternetReachable } = useNetwork();
  const offline = !isOnline || isInternetReachable === false;

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <WifiOff color={theme.colors.mist} size={16} strokeWidth={2.5} />
      <Text style={styles.text}>Offline — local pack guidance only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 70, 70, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.mist,
  },
});
