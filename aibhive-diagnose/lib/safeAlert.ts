import { Alert } from 'react-native';

/** Never show an Alert with an empty body (Android can render a blank dialog). */
export function safeAlert(title: string, message?: string, buttons?: Parameters<typeof Alert.alert>[2]) {
  const t = (title || 'Notice').trim() || 'Notice';
  const m = (message || '').trim() || 'Something went wrong. Please try again.';
  Alert.alert(t, m, buttons);
}
