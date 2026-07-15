import * as Linking from 'expo-linking';
import { FileText, Mail, Shield } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { AI_FIELD_DISCLAIMER, LEGAL_URLS } from '@/lib/legal';

type Props = {
  showDisclaimer?: boolean;
};

export function LegalLinks({ showDisclaimer = true }: Props) {
  const open = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View className="mt-6 rounded-sm border border-hive-border bg-hive-elevated p-4">
      <Text className="text-xs font-bold uppercase tracking-wider text-hive-steel">Legal</Text>
      {showDisclaimer ? (
        <Text className="mt-3 text-xs leading-5 text-hive-steel">{AI_FIELD_DISCLAIMER}</Text>
      ) : null}
      <View className="mt-4 gap-2">
        <Pressable
          onPress={() => open(LEGAL_URLS.privacy)}
          className="min-h-[48px] flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-bg px-3 active:opacity-80"
        >
          <Shield color={theme.colors.amber} size={18} />
          <Text className="flex-1 text-sm font-semibold text-hive-mist">Privacy Policy</Text>
        </Pressable>
        <Pressable
          onPress={() => open(LEGAL_URLS.terms)}
          className="min-h-[48px] flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-bg px-3 active:opacity-80"
        >
          <FileText color={theme.colors.amber} size={18} />
          <Text className="flex-1 text-sm font-semibold text-hive-mist">Terms of Service</Text>
        </Pressable>
        <Pressable
          onPress={() => open(`mailto:${LEGAL_URLS.supportEmail}`)}
          className="min-h-[48px] flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-bg px-3 active:opacity-80"
        >
          <Mail color={theme.colors.amber} size={18} />
          <Text className="flex-1 text-sm font-semibold text-hive-mist">{LEGAL_URLS.supportEmail}</Text>
        </Pressable>
      </View>
    </View>
  );
}
