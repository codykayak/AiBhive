import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { theme } from '@/constants/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { PackProvider } from '@/contexts/PackContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkProvider>
          <PackProvider>
            <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>{children}</View>
          </PackProvider>
        </NetworkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
