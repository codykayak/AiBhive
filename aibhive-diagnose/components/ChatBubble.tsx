import { Image, Text, View } from 'react-native';

import { DiagnosisCard } from '@/components/DiagnosisCard';
import { DiagnoseFieldActions } from '@/components/DiagnoseFieldActions';
import type { ChatMessage } from '@/lib/packs';
import { theme } from '@/constants/theme';

function renderInlineMarkdown(text: string, isUser: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} className="font-bold" style={{ color: isUser ? theme.colors.onPrimary : theme.colors.mist }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={index} style={{ color: isUser ? theme.colors.onPrimary : theme.colors.mist }}>
        {part}
      </Text>
    );
  });
}

export function ChatBubble({
  message,
  showFieldActions = true,
}: {
  message: ChatMessage;
  showFieldActions?: boolean;
}) {
  const isUser = message.role === 'user';

  const showOrderPart = message.diagnoseMeta?.intentType === 'ordering_parts';

  if (!isUser && message.structured) {
    return (
      <View>
        {message.attachment?.uri ? (
          <Image
            source={{ uri: message.attachment.uri }}
            className="mb-2 h-40 w-56 self-start rounded-sm"
            resizeMode="cover"
          />
        ) : null}
        <DiagnosisCard result={message.structured} />
        {message.diagnoseMeta?.notice ? (
          <Text className="mb-2 px-1 text-xs text-hive-steel">{message.diagnoseMeta.notice}</Text>
        ) : null}
        {message.isDiagnosis ? (
          <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-hive-steel">
            Diagnosis
          </Text>
        ) : null}
        {message.diagnoseMeta && showFieldActions ? (
          <DiagnoseFieldActions
            manualSearchLinks={message.diagnoseMeta.manualSearchLinks}
            userQuery={message.diagnoseMeta.userQuery}
            assistantReply={message.content}
            structured={message.structured}
            jobId={message.diagnoseMeta.jobId}
            orderPartPrefill={message.diagnoseMeta.orderPartPrefill}
            autoOpenOrder={message.diagnoseMeta.autoOpenOrder}
            showOrderPart={showOrderPart}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View className={`mb-3 max-w-[92%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-sm px-4 py-3 ${isUser ? 'rounded-br-md bg-hive-amber' : 'rounded-bl-md border border-hive-border bg-hive-card'}`}
      >
        {message.attachment?.uri ? (
          <Image
            source={{ uri: message.attachment.uri }}
            className="mb-2 h-40 w-56 rounded-sm"
            resizeMode="cover"
          />
        ) : null}
        <Text className="text-base leading-6">{renderInlineMarkdown(message.content, isUser)}</Text>
      </View>
      {message.diagnoseMeta?.notice && !isUser ? (
        <Text className="mt-1 px-1 text-xs text-hive-steel">{message.diagnoseMeta.notice}</Text>
      ) : null}
      {message.isDiagnosis && !isUser ? (
        <Text className="mt-1 px-1 text-xs font-semibold uppercase tracking-wide text-hive-steel">
          Diagnosis
        </Text>
      ) : null}
      {!isUser && message.diagnoseMeta && message.role === 'assistant' && showFieldActions ? (
        <DiagnoseFieldActions
          manualSearchLinks={message.diagnoseMeta.manualSearchLinks}
          userQuery={message.diagnoseMeta.userQuery}
          assistantReply={message.content}
          structured={message.structured}
          jobId={message.diagnoseMeta.jobId}
          orderPartPrefill={message.diagnoseMeta.orderPartPrefill}
          autoOpenOrder={message.diagnoseMeta.autoOpenOrder}
          showOrderPart={showOrderPart}
          compact
        />
      ) : null}
    </View>
  );
}
