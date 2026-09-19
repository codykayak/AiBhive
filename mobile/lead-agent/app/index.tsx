import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../lib/context';
import { getActiveBusinessId } from '../lib/storage';

export default function BusinessPicker() {
  const { businesses, setActive } = useApp();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const id = await getActiveBusinessId();
      if (id) router.replace('/(tabs)/dialer');
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lead Agent</Text>
      <Text style={styles.sub}>Pick today&apos;s business — Grok handles SMS while you work.</Text>
      {businesses.map((b) => (
        <Pressable
          key={b.id}
          style={[styles.card, { borderLeftColor: b.brandColor || '#333' }]}
          onPress={async () => {
            await setActive(b.id);
            router.replace('/(tabs)/dialer');
          }}
        >
          <Text style={styles.cardTitle}>{b.name}</Text>
          <Text style={styles.cardSub}>{b.tagline}</Text>
          <Text style={styles.meta}>Suggested {b.dailySmsSuggested || 25} SMS/day · max {b.dailySmsLimit || 40}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.add} onPress={() => router.push('/(tabs)/settings')}>
        <Text style={styles.addText}>+ Add new business (Settings)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 56, backgroundColor: '#f4f6f8', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  sub: { color: '#555', marginTop: 8, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { color: '#666', marginTop: 4 },
  meta: { color: '#888', fontSize: 12, marginTop: 8 },
  add: { padding: 16, alignItems: 'center' },
  addText: { color: '#2563eb', fontWeight: '600' },
});
