import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../lib/context';

export default function MacroreiStart() {
  const { setActive } = useApp();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await setActive('macrorei');
      router.replace('/(tabs)/leads');
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color="#1e4d2b" />
      <Text style={styles.text}>Loading MacroREI Lead Agent…</Text>
      <Pressable
        style={styles.btn}
        onPress={async () => {
          await setActive('macrorei');
          router.replace('/(tabs)/leads');
        }}
      >
        <Text style={styles.btnText}>Open leads</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8', padding: 24 },
  text: { marginTop: 16, color: '#555' },
  btn: { marginTop: 24, backgroundColor: '#1e4d2b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
