import { StyleSheet, Text, View } from 'react-native';

/** Single-screen boot probe — no providers, firebase, or tab routes at startup. */
export default function BootScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>AiBhive Diagnose</Text>
      <Text style={styles.sub}>Boot OK — Expo Go SDK 57</Text>
      <Text style={styles.hint}>
        If you see this screen, the tunnel and bundle are working. Full UI returns in the next
        update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0F14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#F5A623',
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    color: '#E8EEF5',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  hint: {
    color: '#8B9BB0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
});
