import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';

const MAX_CONTENT_WIDTH = 920;

type ResponsiveShellProps = {
  children: React.ReactNode;
};

/** Centers and scales content on Samsung DeX / tablets instead of a tiny phone column. */
export function ResponsiveShell({ children }: ResponsiveShellProps) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 600;

  return (
    <View style={[styles.root, isWide && styles.rootWide]}>
      <View
        style={[
          styles.inner,
          isWide && {
            maxWidth: MAX_CONTENT_WIDTH,
            width: '100%',
            minHeight: height,
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
  rootWide: {
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  return {
    isWide: width >= 600,
    isDesktop: width >= 900,
    contentMaxWidth: width >= 600 ? MAX_CONTENT_WIDTH : width,
  };
}
