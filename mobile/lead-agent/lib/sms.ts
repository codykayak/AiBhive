import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

type SmsBridgeNative = {
  sendSms: (phone: string, body: string) => Promise<{ ok: boolean }>;
  getRecentInbound: () => Promise<{ from: string; body: string; at: number }[]>;
};

const Native: SmsBridgeNative | undefined =
  Platform.OS === 'android' ? NativeModules.LeadAgentSms : undefined;

export async function sendSmsNative(phone: string, body: string) {
  if (!Native?.sendSms) {
    const { Linking } = await import('react-native');
    await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(body)}`);
    return { ok: true, fallback: true };
  }
  return Native.sendSms(phone, body);
}

export function subscribeInbound(handler: (msg: { from: string; body: string }) => void) {
  if (!NativeModules.LeadAgentSms) return () => {};
  const emitter = new NativeEventEmitter(NativeModules.LeadAgentSms);
  const sub = emitter.addListener('LeadAgentSmsReceived', handler);
  return () => sub.remove();
}

export async function pollInbound() {
  if (!Native?.getRecentInbound) return [];
  return Native.getRecentInbound();
}
