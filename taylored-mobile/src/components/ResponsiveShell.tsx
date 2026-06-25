import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { colors } from '../theme/colors';

const MAX_CONTENT_WIDTH = 1400;
const DESKTOP_BREAKPOINT = 840;
const WIDE_BREAKPOINT = 600;

type ResponsiveShellProps = {
  children: React.ReactNode;
};

/** Fills Samsung DeX / tablet / desktop windows — content centers on very wide screens. */
export function ResponsiveShell({ children }: ResponsiveShellProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.inner,
          isWide && styles.innerWide,
          isDesktop && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, width: '100%' },
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
    height: '100%',
    backgroundColor: colors.bg,
    ...(Platform.OS === 'android' ? { alignSelf: 'stretch' as const } : {}),
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  innerWide: {
    flex: 1,
  },
});

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  return {
    isWide,
    isDesktop,
    width,
    height,
    contentMaxWidth: isWide ? Math.min(width, MAX_CONTENT_WIDTH) : width,
  };
}
