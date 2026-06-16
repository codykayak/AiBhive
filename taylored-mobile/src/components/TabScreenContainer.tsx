import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const TAB_BAR_BODY_HEIGHT = 58;

export function useTabBarPadding(extra = 16) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  return TAB_BAR_BODY_HEIGHT + bottomInset + extra;
}

type Props = {
  children: React.ReactNode;
  style?: object;
};

/** Keeps scrollable tab content above the bottom tab bar + Android gesture area. */
export function TabScreenContainer({ children, style }: Props) {
  const tabPadding = useTabBarPadding(20);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: tabPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
