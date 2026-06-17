import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';

/** Legacy route — forwards to Job Profile research tab. */
export default function DeeperScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params || {};

  useEffect(() => {
    if (jobId) {
      navigation.replace('JobDetail', { jobId, tab: 'research' });
    } else {
      navigation.goBack();
    }
  }, [jobId, navigation]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.amberLight} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
