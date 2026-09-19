import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../../lib/storage';
import { useApp } from '../../lib/context';

type WorkMode = {
  title?: string;
  marketingLine?: { display: string; e164: string };
  grokVoiceLine?: { display: string; e164: string };
  steps?: string[];
  carrierCodes?: { forwardAll: string; forwardAllNote: string; cancelForward: string; cancelNote: string };
  tips?: string[];
};

const WORK_MODE_KEY = 'leadagent.workModeOn';

export default function WorkModeScreen() {
  const { active } = useApp();
  const [on, setOn] = useState(false);
  const [guide, setGuide] = useState<WorkMode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void AsyncStorage.getItem(WORK_MODE_KEY).then((v) => setOn(v === '1'));
  }, []);

  useEffect(() => {
    if (active?.id !== 'macrorei') return;
    void (async () => {
      try {
        const base = await getApiBase();
        const res = await fetch(`${base}/api/lead-agent/work-mode/macrorei`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setGuide(data);
      } catch (e) {
        setGuide({
          title: 'Work Mode — Grok answers before voicemail',
          marketingLine: { display: '(541) 321-2630', e164: '+15413212630' },
          grokVoiceLine: { display: '(541) 321-2630', e164: '+15413212630' },
          steps: [
            'Attach MacroREI agent to your Grok voice number in xAI Voice Agent Builder.',
            'Forward unanswered calls (or all calls) from your cell to the Grok line below.',
            'Turn off carrier voicemail or Grok may lose the race.',
            'Dial *73 when you get home to cancel forwarding.',
          ],
          carrierCodes: {
            forwardAll: '*72+15413212630#',
            forwardAllNote: 'Forward all calls to Grok line while at work.',
            cancelForward: '*73#',
            cancelNote: 'Cancel call forwarding.',
          },
          tips: ['Server offline — showing default MacroREI numbers. Deploy server for live Grok line.'],
        });
        setError(String(e));
      }
    })();
  }, [active?.id]);

  const toggleWorkMode = async (value: boolean) => {
    setOn(value);
    await AsyncStorage.setItem(WORK_MODE_KEY, value ? '1' : '0');
  };

  const dial = (num: string) => Linking.openURL(`tel:${num.replace(/#/g, '%23')}`);

  if (active?.id !== 'macrorei') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Work Mode</Text>
        <Text style={styles.body}>Switch to MacroREI on the home screen to set up Grok call answering.</Text>
      </View>
    );
  }

  const grok = guide?.grokVoiceLine;
  const codes = guide?.carrierCodes;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{guide?.title || 'Work Mode'}</Text>
      <Text style={styles.sub}>Grok answers forwarded calls before your voicemail.</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Work mode (reminder)</Text>
        <Switch value={on} onValueChange={toggleWorkMode} trackColor={{ true: '#1e4d2b' }} />
      </View>
      {on ? (
        <Text style={styles.onHint}>Remember: forward your cell to the Grok line below.</Text>
      ) : null}

      {grok ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Grok voice line (forward here)</Text>
          <Text style={styles.bigPhone}>{grok.display}</Text>
          <Pressable style={styles.btn} onPress={() => dial(grok.e164)}>
            <Text style={styles.btnText}>Test call Grok line</Text>
          </Pressable>
        </View>
      ) : null}

      {guide?.marketingLine ? (
        <Text style={styles.meta}>Marketing line on macrorei.com: {guide.marketingLine.display}</Text>
      ) : null}

      <Text style={styles.section}>Setup steps</Text>
      {(guide?.steps || []).map((step, i) => (
        <Text key={i} style={styles.step}>{i + 1}. {step}</Text>
      ))}

      {codes ? (
        <>
          <Text style={styles.section}>Carrier shortcuts</Text>
          <Pressable style={styles.chip} onPress={() => dial(codes.forwardAll)}>
            <Text style={styles.chipTitle}>Forward all → Grok</Text>
            <Text style={styles.chipCode}>{codes.forwardAll}</Text>
            <Text style={styles.chipNote}>{codes.forwardAllNote}</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => dial(codes.cancelForward)}>
            <Text style={styles.chipTitle}>Cancel forwarding</Text>
            <Text style={styles.chipCode}>{codes.cancelForward}</Text>
            <Text style={styles.chipNote}>{codes.cancelNote}</Text>
          </Pressable>
        </>
      ) : null}

      {(guide?.tips || []).map((tip, i) => (
        <Text key={`t-${i}`} style={styles.tip}>• {tip}</Text>
      ))}

      {error ? <Text style={styles.err}>Offline defaults ({error})</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 48, paddingBottom: 40, backgroundColor: '#f4f6f8' },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  sub: { color: '#555', marginTop: 6, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontWeight: '600' },
  onHint: { color: '#1e4d2b', marginBottom: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 5, borderLeftColor: '#1e4d2b' },
  cardTitle: { fontWeight: '700', color: '#333' },
  bigPhone: { fontSize: 26, fontWeight: '800', marginVertical: 8 },
  btn: { backgroundColor: '#1e4d2b', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  meta: { color: '#666', marginBottom: 16, fontSize: 13 },
  section: { fontWeight: '800', fontSize: 16, marginTop: 12, marginBottom: 8 },
  step: { color: '#333', marginBottom: 8, lineHeight: 20 },
  chip: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10 },
  chipTitle: { fontWeight: '700' },
  chipCode: { fontFamily: 'monospace', marginTop: 4, fontSize: 15 },
  chipNote: { color: '#666', fontSize: 12, marginTop: 4 },
  tip: { color: '#555', marginTop: 6, lineHeight: 18 },
  body: { color: '#555', marginTop: 12 },
  err: { color: '#b45309', marginTop: 16, fontSize: 12 },
});
