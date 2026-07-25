import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import { isPlantsInAppUrl } from './plantsNavigation';

SplashScreen.preventAutoHideAsync().catch(() => {});

const PLANTS_URL =
  process.env.EXPO_PUBLIC_PLANTS_URL?.trim() || 'https://aibhive.com/plants?mobile=1';

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    if (isPlantsInAppUrl(request.url)) return true;
    void Linking.openURL(request.url);
    return false;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          source={{ uri: PLANTS_URL }}
          style={{ flex: 1, backgroundColor: '#0f172a' }}
          onNavigationStateChange={onNavChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadEnd={() => {
            setLoading(false);
            void SplashScreen.hideAsync();
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          originWhitelist={['https://*']}
          userAgent="AiBhivePlants/1.0.2 Android"
        />
        {loading ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
            }}
          >
            <ActivityIndicator size="large" color="#34d399" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
