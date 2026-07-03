import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { AppThemeShell } from '../components/AppThemeShell';
import { builtInAppForThemeKey } from '../constants/builtInHiveApps';
import { enhancedRunnerUrl } from '../constants/enhancedHiveApps';
import { colors, spacing } from '../theme/colors';

type Params = {
  runnerId?: string;
  title?: string;
  url?: string;
  themeKey?: 'tracker' | 'resume' | 'research' | 'homework' | 'social' | 'flip';
};

const THEME_BY_RUNNER: Record<string, Params['themeKey']> = {
  'example-house-flip': 'flip',
  'example-social-post-hunter': 'social',
  'example-homework-bot': 'homework',
};

export default function HiveAppWebViewScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ HiveAppWebView: Params }, 'HiveAppWebView'>>();
  const params = route.params || {};
  const runnerId = params.runnerId || '';
  const themeKey = params.themeKey || THEME_BY_RUNNER[runnerId] || 'research';
  const theme = builtInAppForThemeKey(themeKey) || builtInAppForThemeKey('research')!;
  const uri = useMemo(
    () => params.url || enhancedRunnerUrl(runnerId) || 'https://aibhive.com/hive-apps',
    [params.url, runnerId]
  );
  const [loading, setLoading] = useState(true);

  return (
    <AppThemeShell theme={theme} title={params.title || theme.title}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.accentText} size={22} />
          <Text style={[styles.backText, { color: theme.accentText }]}>Back</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        <WebView
          source={{ uri }}
          style={styles.web}
          onLoadEnd={() => setLoading(false)}
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
        />
      </View>
    </AppThemeShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backText: { fontSize: 15, fontWeight: '700' },
  web: { flex: 1, backgroundColor: colors.bg },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
