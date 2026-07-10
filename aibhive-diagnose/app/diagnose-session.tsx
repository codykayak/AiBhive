import { useLocalSearchParams } from 'expo-router';

import { DiagnoseChat } from '@/components/DiagnoseChat';

export default function DiagnoseSessionScreen() {
  const params = useLocalSearchParams<{ camera?: string; prompt?: string }>();

  return (
    <DiagnoseChat
      autoCamera={params.camera === '1'}
      initialPrompt={typeof params.prompt === 'string' ? params.prompt : undefined}
    />
  );
}
