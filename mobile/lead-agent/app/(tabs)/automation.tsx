import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../lib/context';
import {
  automationIsActive,
  getSentTodayForBusiness,
  isAutomationRunning,
  sendNextLeadNow,
  startAutomation,
  stopAutomation,
} from '../../lib/automationRunner';
import { automationLeadPool, personalizeOutbound, pickNextLead } from '../../lib/localAutomation';
import { formatLeadDisplayName } from '../../lib/nameFormatting';
import { ensureSmsPermissions } from '../../lib/permissions';

function formatAddressForDisplay(addr?: string): string {
  const raw = addr?.trim();
  if (!raw) return '';
  return raw
    .split(/\s+/)
    .map((w) => {
      if (/^\d+[A-Za-z-]*$/.test(w)) return w;
      if (/^(n|s|e|w|ne|nw|se|sw)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

export default function AutomationScreen() {
  const { active, businesses, setActive, leads, upsertLead, updateBusiness, reloadLeads } = useApp();
  const [on, setOn] = useState(false);
  const [sentToday, setSentToday] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const handlersRef = useRef({
    onLog: (line: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 40)),
    getBusiness: () => active,
    getLeads: () => leads,
    upsertLead,
  });

  useFocusEffect(
    useCallback(() => {
      void reloadLeads();
    }, [reloadLeads]),
  );

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
      const ok = await ensureSmsPermissions();
      if (!ok) {
        setLog((prev) => [`${new Date().toLocaleTimeString()} SMS permission required`, ...prev]);
        return;
      }
      await startAutomation(handlersRef.current);
      setOn(true);
    } else {
      await stopAutomation();
      setOn(false);
    }
  };

  const brand = active?.brandColor || '#1e4d2b';
  const readyCount = automationLeadPool(leads).length;
  const nextLead = pickNextLead(leads);
  const previewBody = active && nextLead ? personalizeOutbound(active, nextLead) : '';

  const sendOneNow = async () => {
    try {
      await sendNextLeadNow(handlersRef.current);
      if (active) setSentToday(await getSentTodayForBusiness(active.id));
    } catch (e) {
      setLog((prev) => [`${new Date().toLocaleTimeString()} ${e}`, ...prev]);
    }
  };

  const patchLimit = async (delta: number) => {
    if (!active) return;
    const next = Math.max(5, Math.min(80, (active.dailySmsLimit || 25) + delta));
    await updateBusiness({ dailySmsLimit: next });
  };

  if (!active) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.title}>Automation</Text>
          <Text style={styles.muted}>Select a business on the home screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.title}>Automation</Text>
        <Text style={styles.subhead}>Next outbound texts use your pacing and templates for {active.name}.</Text>

        <View style={styles.chipWrap}>
          {businesses.map((b) => {
            const selected = b.id === active.id;
            return (
              <Pressable
                key={b.id}
                style={[styles.bizChip, selected && { backgroundColor: b.brandColor || brand, borderColor: b.brandColor || brand }]}
                onPress={() => void setActive(b.id)}
              >
                <Text style={[styles.bizChipText, selected && styles.bizChipTextOn]}>{b.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.body}>
          Paced auto-SMS to new MacroREI leads from your uploaded list ({readyCount} ready with phone + address). Grok
          replies to inbound texts using macrorei.com RAG (Settings → Test server / Refresh RAG).
        </Text>

        {previewBody ? (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Next message</Text>
            <Text style={styles.previewText}>{previewBody}</Text>
            {nextLead ? (
              <Text style={styles.previewMeta}>
                → {formatLeadDisplayName(nextLead.name)} · {formatAddressForDisplay(nextLead.propertyAddress || nextLead.notes)}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>No ready leads yet</Text>
            <Text style={styles.warn}>
              Upload leads on the Leads tab ({leads.length} saved, {readyCount} ready). Each row needs phone + property
              address — check the import message if the ready count is 0.
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: brand }, pressed && styles.primaryBtnPressed]}
          onPress={() => void sendOneNow()}
        >
          <Text style={styles.primaryBtnText}>Send 1 test SMS now</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Text style={styles.label}>Run automation</Text>
              <Text style={styles.rowHint}>Texts only in your send window</Text>
            </View>
            <Switch value={on} onValueChange={toggle} trackColor={{ true: brand, false: '#cbd5e1' }} thumbColor="#fff" />
          </View>

          <View style={styles.statsBlock}>
            <Text style={styles.stat}>
              Sent today: <Text style={styles.statEm}>{sentToday}</Text> / {active.dailySmsLimit ?? 25} (suggested{' '}
              {active.dailySmsSuggested ?? 25})
            </Text>
            <Text style={styles.stat}>
              Pace: {active.minDelayMinutes ?? 6}–{active.maxDelayMinutes ?? 15} min between texts · hours{' '}
              {active.sendWindowStart ?? 9}–{active.sendWindowEnd ?? 18}
            </Text>
          </View>

          <View style={styles.limitRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => void patchLimit(-5)}>
              <Text style={styles.secondaryBtnText}>Daily max −5</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => void patchLimit(5)}>
              <Text style={styles.secondaryBtnText}>Daily max +5</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.platformNote}>
          {Platform.OS === 'ios'
            ? 'On iPhone, SMS opens Messages — tap Send each time, or use Twilio in Settings. Paced all-day automation needs Android or Twilio.'
            : 'Keep this screen open in the foreground while automation runs (Android).'}
        </Text>

        <Text style={styles.section}>Activity</Text>
        {log.length === 0 ? <Text style={styles.muted}>No activity yet.</Text> : null}
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1 },
  centered: { flex: 1, padding: 24, justifyContent: 'center' },
  container: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subhead: { marginTop: 6, fontSize: 15, color: '#64748b', lineHeight: 22 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 8 },
  bizChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bizChipText: { fontWeight: '700', fontSize: 13, color: '#334155' },
  bizChipTextOn: { color: '#fff' },
  body: { color: '#475569', marginTop: 8, marginBottom: 16, lineHeight: 22, fontSize: 15 },
  preview: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1e4d2b',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  previewLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 },
  previewText: { marginTop: 10, lineHeight: 24, color: '#0f172a', fontSize: 16 },
  previewMeta: { marginTop: 12, fontSize: 13, color: '#64748b' },
  warnCard: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warnTitle: { fontWeight: '800', color: '#92400e', marginBottom: 6 },
  warn: { color: '#a16207', fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabelWrap: { flex: 1 },
  rowHint: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  label: { fontWeight: '800', fontSize: 17, color: '#0f172a' },
  statsBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0' },
  stat: { color: '#475569', marginBottom: 6, fontSize: 14, lineHeight: 20 },
  statEm: { fontWeight: '800', color: '#0f172a' },
  limitRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  secondaryBtnText: { fontWeight: '700', color: '#0369a1', fontSize: 15 },
  platformNote: { color: '#b45309', marginTop: 8, fontSize: 13, lineHeight: 19 },
  section: { fontWeight: '800', marginTop: 24, marginBottom: 10, fontSize: 16, color: '#0f172a' },
  muted: { color: '#94a3b8', fontSize: 14 },
  logLine: { fontSize: 12, color: '#475569', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
