import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useApp } from '../../lib/context';
import {
  automationIsActive,
  getSentTodayForBusiness,
  isAutomationRunning,
  startAutomation,
  stopAutomation,
} from '../../lib/automationRunner';

export default function AutomationScreen() {
  const { active, businesses, setActive, leads, upsertLead, updateBusiness } = useApp();
  const [on, setOn] = useState(false);
  const [sentToday, setSentToday] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const handlersRef = useRef({
    onLog: (line: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 40)),
    getBusiness: () => active,
    getLeads: () => leads,
    upsertLead,
  });

  useEffect(() => {
    handlersRef.current = {
      onLog: (line: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 40)),
      getBusiness: () => active,
      getLeads: () => leads,
      upsertLead,
    };
  }, [active, leads, upsertLead]);

  useEffect(() => {
    void (async () => {
      if (active) setSentToday(await getSentTodayForBusiness(active.id));
      setOn(await isAutomationRunning());
    })();
  }, [active?.id]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (active) setSentToday(await getSentTodayForBusiness(active.id));
      setOn(automationIsActive() || (await isAutomationRunning()));
    }, 5000);
    return () => clearInterval(id);
  }, [active?.id]);

  const toggle = async (value: boolean) => {
    if (!active) return;
    if (value) {
      await startAutomation(handlersRef.current);
      setOn(true);
    } else {
      await stopAutomation();
      setOn(false);
    }
  };

  const patchLimit = async (delta: number) => {
    if (!active) return;
    const next = Math.max(5, Math.min(80, (active.dailySmsLimit || 25) + delta));
    await updateBusiness({ dailySmsLimit: next });
  };

  if (!active) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Automation</Text>
        <Text>Select a business on the home screen.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Automation · {active.name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bizRow}>
        {businesses.map((b) => (
          <Pressable
            key={b.id}
            style={[styles.bizChip, b.id === active.id && { backgroundColor: b.brandColor || '#1e4d2b' }]}
            onPress={() => setActive(b.id)}
          >
            <Text style={[styles.bizChipText, b.id === active.id && { color: '#fff' }]}>{b.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.sub}>
        Auto-sends your prescribed greeting to new leads (paced). Grok replies to inbound SMS using website RAG when
        server + device secret are set in Settings.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Run automation</Text>
        <Switch value={on} onValueChange={toggle} trackColor={{ true: active.brandColor || '#1e4d2b' }} />
      </View>

      <Text style={styles.stat}>
        Sent today: {sentToday} / {active.dailySmsLimit ?? 25} (suggested {active.dailySmsSuggested ?? 25})
      </Text>
      <Text style={styles.stat}>
        Pace: {active.minDelayMinutes ?? 6}–{active.maxDelayMinutes ?? 15} min between texts · hours{' '}
        {active.sendWindowStart ?? 9}–{active.sendWindowEnd ?? 18}
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.chip} onPress={() => patchLimit(-5)}>
          <Text>Daily max −5</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={() => patchLimit(5)}>
          <Text>Daily max +5</Text>
        </Pressable>
      </View>

      <Text style={styles.warn}>Keep this app open in the foreground while automation runs (Android).</Text>

      <Text style={styles.section}>Activity</Text>
      {log.length === 0 ? <Text style={styles.muted}>No activity yet.</Text> : null}
      {log.map((line, i) => (
        <Text key={i} style={styles.logLine}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 48, paddingBottom: 48, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '800' },
  bizRow: { marginTop: 8, marginBottom: 4, maxHeight: 44 },
  bizChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 8 },
  bizChipText: { fontWeight: '700', fontSize: 13 },
  sub: { color: '#555', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8, gap: 8 },
  label: { fontWeight: '700', fontSize: 16 },
  stat: { color: '#333', marginBottom: 4 },
  chip: { flex: 1, backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, alignItems: 'center' },
  warn: { color: '#b45309', marginTop: 12, fontSize: 13 },
  section: { fontWeight: '800', marginTop: 20, marginBottom: 8 },
  muted: { color: '#888' },
  logLine: { fontSize: 12, color: '#334155', marginBottom: 4, fontFamily: 'monospace' },
});
