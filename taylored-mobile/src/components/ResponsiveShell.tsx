import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';
import { useDexLayout } from '../hooks/useDexLayout';

type ResponsiveShellProps = {
  children: React.ReactNode;
};

/** Full-width shell on Samsung DeX — no skinny phone column on a monitor. */
export function ResponsiveShell({ children }: ResponsiveShellProps) {
  const { height } = useWindowDimensions();
  const { isDex, isDesktop, contentMaxWidth, contentPadding } = useDexLayout();

  return (
    <View style={[styles.root, isDex && styles.rootDex]}>
      <View
        style={[
          styles.inner,
          isDex && {
            width: '100%',
            maxWidth: contentMaxWidth,
            minHeight: height,
            paddingHorizontal: isDesktop ? contentPadding : 0,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
  },
  rootDex: {
    alignItems: 'stretch',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});

export function useResponsiveLayout() {
  return useDexLayout();
}
