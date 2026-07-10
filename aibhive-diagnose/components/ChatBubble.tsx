import { Image, Text, View } from 'react-native';

import type { ChatMessage } from '@/lib/packs';
import { theme } from '@/constants/theme';

function renderInlineMarkdown(text: string, isUser: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} className="font-bold" style={{ color: isUser ? theme.colors.bg : theme.colors.mist }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={index} style={{ color: isUser ? theme.colors.bg : theme.colors.mist }}>
        {part}
      </Text>
    );
  });
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 max-w-[92%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-md bg-hive-amber' : 'rounded-bl-md border border-hive-border bg-hive-card'}`}
      >
        {message.attachment?.uri ? (
          <Image
            source={{ uri: message.attachment.uri }}
            className="mb-2 h-40 w-56 rounded-xl"
            resizeMode="cover"
          />
        ) : null}
        <Text className="text-base leading-6">{renderInlineMarkdown(message.content, isUser)}</Text>
      </View>
      {message.isDiagnosis && !isUser ? (
        <Text className="mt-1 px-1 text-xs font-semibold uppercase tracking-wide text-hive-steel">
          Diagnosis
        </Text>
      ) : null}
    </View>
  );
}
