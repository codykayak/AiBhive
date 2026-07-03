import type { NavigationProp } from '@react-navigation/native';

/** Open Research — full web Intel app with Hive credits always on. */
export function openResearch(
  navigation: NavigationProp<any>,
  prefillIntent?: string,
  opts?: { replace?: boolean }
) {
  const intentQuery = prefillIntent?.trim()
    ? `&intent=${encodeURIComponent(prefillIntent.trim())}`
    : '';
  const params = {
    runnerId: 'example-research',
    title: 'Research',
    themeKey: 'research' as const,
    url: `https://aibhive.com/hive-apps/run/example-research?mobile=1${intentQuery}`,
  };
  if (opts?.replace) {
    navigation.replace('HiveAppWebView', params);
    return;
  }
  navigation.navigate('HiveAppWebView', params);
}
