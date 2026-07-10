import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { DiagnoseChat } from '@/components/DiagnoseChat';

export default function DiagnoseScreen() {
  const params = useLocalSearchParams<{ voice?: string; prompt?: string }>();

  useEffect(() => {
    // Voice deep-link is handled inside DiagnoseChat via initial prompt seeding.
  }, [params.voice]);

  return (
    <DiagnoseChat
      initialPrompt={
        typeof params.prompt === 'string'
          ? params.prompt
          : params.voice === '1'
            ? undefined
            : undefined
      }
    />
  );
}
