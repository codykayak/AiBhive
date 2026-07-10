import { Briefcase, Clock, MapPin, Plus } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';

const PLACEHOLDER_JOBS = [
  {
    id: '1',
    title: 'Filter pressure high — backwash overdue',
    address: '1420 Palm Court',
    status: 'In progress',
    pack: 'pool' as const,
  },
  {
    id: '2',
    title: 'Panel warm at main lugs',
    address: '88 Industrial Way',
    status: 'Queued',
    pack: 'electrical' as const,
  },
  {
    id: '3',
    title: 'Salt cell no output',
    address: '6 Harbor Lane',
    status: 'Scheduled',
    pack: 'pool' as const,
  },
];

export default function JobsScreen() {
  const { activePack } = usePack();

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerClassName="px-5 pb-10 pt-4">
      <Text className="text-2xl font-bold text-hive-mist">Jobs</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Field job list scaffold — invoicing and parts ordering come next.
      </Text>

      <View className="mt-5">
        <BigButton
          label="New Job"
          subtitle={`Defaults to ${activePack.shortName} Pack`}
          icon={<Plus color={theme.colors.bg} size={26} strokeWidth={2.5} />}
          onPress={() => {}}
        />
      </View>

      <View className="mt-6 gap-3">
        {PLACEHOLDER_JOBS.map((job) => (
          <View
            key={job.id}
            className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-4"
          >
            <View className="mb-2 flex-row items-center gap-2">
              <Briefcase color={theme.colors.amber} size={18} strokeWidth={2.4} />
              <Text className="text-xs font-bold uppercase tracking-wide text-hive-amber">
                {job.status}
              </Text>
            </View>
            <Text className="text-lg font-bold text-hive-mist">{job.title}</Text>
            <View className="mt-2 flex-row items-center gap-2">
              <MapPin color={theme.colors.steel} size={16} />
              <Text className="text-sm text-hive-steel">{job.address}</Text>
            </View>
            <View className="mt-1 flex-row items-center gap-2">
              <Clock color={theme.colors.steel} size={16} />
              <Text className="text-sm text-hive-steel">
                {job.pack === 'pool' ? 'Pool Services' : 'Electrical'} Pack
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
