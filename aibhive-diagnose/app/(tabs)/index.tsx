import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';

/** Minimal StyleSheet home — no NativeWind/lucide on the Expo Go boot path. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { activePack } = usePack();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 36 + insets.bottom, paddingHorizontal: 20 }}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>AiBhive</Text>
        <Text style={styles.title}>Diagnose</Text>
        <Text style={styles.sub}>
          {profile?.displayName || 'Field tech'} · {activePack.shortName} pack active
        </Text>
      </View>

      <Pressable style={styles.btnPrimary} onPress={() => router.push('/(tabs)/diagnose')}>
        <Text style={styles.btnPrimaryText}>Voice / chat diagnose</Text>
      </Pressable>
      <Pressable
        style={styles.btnSecondary}
        onPress={() => router.push({ pathname: '/diagnose-session', params: { camera: '1' } })}
      >
        <Text style={styles.btnSecondaryText}>Camera diagnosis</Text>
      </Pressable>
      <Pressable style={styles.btnSecondary} onPress={() => router.push('/tools')}>
        <Text style={styles.btnSecondaryText}>Field tools</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  hero: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  eyebrow: {
    color: theme.colors.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: theme.colors.mist,
    fontSize: 32,
    fontWeight: '800',
  },
  sub: {
    marginTop: 8,
    color: theme.colors.steel,
    fontSize: 15,
    lineHeight: 22,
  },
  btnPrimary: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimaryText: {
    color: theme.colors.bg,
    fontSize: 17,
    fontWeight: '800',
  },
  btnSecondary: {
    marginTop: 12,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnSecondaryText: {
    color: theme.colors.mist,
    fontSize: 17,
    fontWeight: '700',
  },
});
