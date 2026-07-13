import { useLocalSearchParams } from 'expo-router';

import { DiagnoseChat } from '@/components/DiagnoseChat';

export default function DiagnoseSessionScreen() {
  const params = useLocalSearchParams<{
    camera?: string;
    prompt?: string;
    voice?: string;
    jobId?: string;
  }>();

  return (
    <DiagnoseChat
      autoCamera={params.camera === '1'}
      autoVoice={params.voice === '1' || params.voice === 'true'}
      initialPrompt={typeof params.prompt === 'string' ? params.prompt : undefined}
      jobId={typeof params.jobId === 'string' ? params.jobId : undefined}
    />
  );
}
