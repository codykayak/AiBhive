import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Missing route' }} />
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-xl font-bold text-hive-mist">Screen not found</Text>
        <Link href="/" className="mt-4">
          <Text className="text-base font-semibold text-hive-amber">Back to Home</Text>
        </Link>
      </View>
    </>
  );
}
