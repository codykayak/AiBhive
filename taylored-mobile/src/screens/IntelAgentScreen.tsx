import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { openResearch } from '../lib/researchNavigation';
import { colors } from '../theme/colors';

/** Legacy route — Research now runs the full web Intel app (Hive credits always on). */
export default function IntelAgentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefillIntent = route.params?.prefillIntent as string | undefined;

  useEffect(() => {
    openResearch(navigation, prefillIntent, { replace: true });
  }, [navigation, prefillIntent]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.amber} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
