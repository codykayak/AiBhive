import { Image, View } from 'react-native';

import { theme } from '@/constants/theme';

const AIBHIVE_LOGO = require('../assets/brand/aibhive-logo.png');

export function AiBhiveLogo({ size = 48, rounded = true }: { size?: number; rounded?: boolean }) {
  return (
    <Image
      source={AIBHIVE_LOGO}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
      resizeMode="contain"
      accessibilityLabel="AiBhive"
    />
  );
}

/** Static brand orb — intentionally no Reanimated (keeps Home boot safe in Expo Go). */
export function DiagnoseOrb({ size = 120 }: { size?: number }) {
  const logoSize = size * 0.62;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: `${theme.colors.amber}55`,
        }}
      />
      <View
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size,
          backgroundColor: theme.colors.elevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AiBhiveLogo size={logoSize} />
      </View>
    </View>
  );
}
