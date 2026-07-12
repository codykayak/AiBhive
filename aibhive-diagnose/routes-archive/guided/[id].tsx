import { useLocalSearchParams } from 'expo-router';

import { GuidedFlowPlayer } from '@/components/GuidedFlowPlayer';

export default function GuidedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GuidedFlowPlayer flowId={typeof id === 'string' ? id : ''} />;
}
