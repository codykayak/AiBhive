import { useLocalSearchParams } from 'expo-router';

import { DiagnoseChat } from '@/components/DiagnoseChat';

export default function DiagnoseScreen() {
  const params = useLocalSearchParams<{ voice?: string; prompt?: string }>();
  const prompt = typeof params.prompt === 'string' ? params.prompt : undefined;

  return <DiagnoseChat initialPrompt={prompt} />;
}
