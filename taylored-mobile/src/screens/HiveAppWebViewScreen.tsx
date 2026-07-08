import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { AppThemeShell } from '../components/AppThemeShell';
import { builtInAppForThemeKey } from '../constants/builtInHiveApps';
import { enhancedRunnerUrl } from '../constants/enhancedHiveApps';
import { getOrCreateHiveUserId } from '../lib/hiveApi';
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
  'example-research': 'research',
};

function appendHiveUserId(baseUrl: string, userId: string): string {
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}hiveUserId=${encodeURIComponent(userId)}`;
}

export default function HiveAppWebViewScreen() {
  const route = useRoute<RouteProp<{ HiveAppWebView: Params }, 'HiveAppWebView'>>();
  const params = route.params || {};
  const runnerId = params.runnerId || '';
  const themeKey = params.themeKey || THEME_BY_RUNNER[runnerId] || 'research';
  const theme = builtInAppForThemeKey(themeKey) || builtInAppForThemeKey('research')!;
  const baseUri = useMemo(
    () => params.url || enhancedRunnerUrl(runnerId) || 'https://aibhive.com/hive-apps',
    [params.url, runnerId]
  );
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const userId = await getOrCreateHiveUserId();
      if (!cancelled) setUri(appendHiveUserId(baseUri, userId));
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUri]);

  return (
    <AppThemeShell theme={theme} title={params.title || theme.title} contentStyle={styles.shellContent}>
      <View style={styles.container}>
        {loading && !loadError ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Text style={styles.errorHint}>Check your connection and try again.</Text>
          </View>
        ) : null}

        {uri ? (
          <WebView
            source={{ uri }}
            style={styles.web}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['https://*', 'http://*']}
            onLoadStart={() => {
              setLoading(true);
              setLoadError('');
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setLoadError('Could not load this app.');
            }}
            onHttpError={() => {
              setLoading(false);
              setLoadError('Could not load this app.');
            }}
          />
        ) : null}
      </View>
    </AppThemeShell>
  );
}

const styles = StyleSheet.create({
  shellContent: { paddingHorizontal: 0 },
  container: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1, backgroundColor: '#070a0f' },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  errorText: { color: colors.text, fontWeight: '700', fontSize: 15, textAlign: 'center' },
  errorHint: { color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' },
});
