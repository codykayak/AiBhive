import React, { createContext, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuiltInHiveApp } from '../constants/builtInHiveApps';
import { radii, spacing } from '../theme/colors';

const HEADER_COLLAPSE = 64;

type ThemeContextValue = {
  theme: BuiltInHiveApp;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeShell');
  return ctx.theme;
}

type Props = {
  theme: BuiltInHiveApp;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
};

/** Standalone app chrome — no AiBhive background; collapsible header on scroll. */
export function AppThemeShell({ theme, title, subtitle, children, contentStyle }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  const heroTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_COLLAPSE],
    outputRange: [0, -48],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_COLLAPSE * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const displayTitle = title ?? theme.title;

  return (
    <ThemeContext.Provider value={{ theme, onScroll }}>
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 6, borderBottomColor: theme.primary + '33' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <ChevronLeft color={theme.accentText} size={24} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={[styles.appName, { color: theme.accentText }]}>{displayTitle}</Text>
            <Text style={styles.creator}>by {theme.creator}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {!!subtitle && (
          <Animated.View
            style={[
              styles.hero,
              {
                backgroundColor: theme.surface,
                borderColor: theme.primary + '44',
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslate }],
              },
            ]}
          >
            <Text style={[styles.subtitle, { color: theme.accentText + 'cc' }]}>{subtitle}</Text>
          </Animated.View>
        )}

        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </ThemeContext.Provider>
  );
}

type ScrollProps = {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
};

export function AppThemeScroll({ children, contentContainerStyle, refreshControl, keyboardShouldPersistTaps }: ScrollProps) {
  const ctx = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={ctx?.onScroll}
      scrollEventThrottle={16}
      refreshControl={refreshControl as never}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[{ paddingBottom: 24 + insets.bottom }, contentContainerStyle]}
    >
      {children}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  appName: {
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  creator: {
    color: 'rgba(148,163,184,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  hero: {
    marginHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
