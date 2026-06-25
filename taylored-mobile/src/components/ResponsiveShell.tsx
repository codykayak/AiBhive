import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { colors } from '../theme/colors';

const MAX_CONTENT_WIDTH = 1200;

type ResponsiveShellProps = {
  children: React.ReactNode;
};

/** Fills Samsung DeX / tablet / desktop windows — content centers on very wide screens. */
export function ResponsiveShell({ children }: ResponsiveShellProps) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 600;
  const isDesktop = width >= 900;

  return (
    <View style={[styles.root, { width, height, minHeight: height }]}>
      <View
        style={[
          styles.inner,
          isWide && styles.innerWide,
          isDesktop && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const },
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
    backgroundColor: colors.bg,
    ...(Platform.OS === 'android' ? { alignSelf: 'stretch' as const } : {}),
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  innerWide: {
    width: '100%',
  },
});

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return {
    isWide: width >= 600,
    isDesktop: width >= 900,
    width,
    height,
    contentMaxWidth: width >= 600 ? Math.min(width, MAX_CONTENT_WIDTH) : width,
  };
}
