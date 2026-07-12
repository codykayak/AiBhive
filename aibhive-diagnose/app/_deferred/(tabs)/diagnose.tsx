import { useLocalSearchParams } from 'expo-router';

import { DiagnoseChat } from '@/components/DiagnoseChat';

export default function DiagnoseScreen() {
  const params = useLocalSearchParams<{ voice?: string; prompt?: string; jobId?: string }>();
  const prompt = typeof params.prompt === 'string' ? params.prompt : undefined;
  const jobId = typeof params.jobId === 'string' ? params.jobId : undefined;
  const autoVoice = params.voice === '1' || params.voice === 'true';

  return (
    <DiagnoseChat
      initialPrompt={prompt}
      autoVoice={autoVoice}
      jobId={jobId}
      embedInTabs
    />
  );
}
