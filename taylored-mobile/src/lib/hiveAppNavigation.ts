import type { NavigationProp } from '@react-navigation/native';
import { resolveEnhancedRunnerForApp } from '../constants/enhancedHiveApps';

type AppLike = {
  id?: string;
  sourceCommunityAppId?: string | null;
  title?: string;
  route?: string;
  runnerId?: string;
};

export function openHiveApp(navigation: NavigationProp<any>, app: AppLike) {
  if (app.route === 'HiveAppWebView' && app.runnerId) {
    navigation.navigate('HiveAppWebView', { runnerId: app.runnerId, title: app.title });
    return;
  }

  const runnerUrl = resolveEnhancedRunnerForApp(app);
  if (runnerUrl) {
    const runnerId = app.sourceCommunityAppId || app.id || app.runnerId;
    navigation.navigate('HiveAppWebView', { runnerId, title: app.title, url: runnerUrl });
    return;
  }

  if (app.route) {
    navigation.navigate(app.route);
    return;
  }

  if (app.id) {
    navigation.navigate('DynamicApp', { appId: app.id, app });
  }
}
