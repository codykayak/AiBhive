import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { saveBusiness, checkLeadAgentHealth, refreshBusinessRag } from '../../lib/api';
import { useApp } from '../../lib/context';
import {
  getApiBase,
  getAuthToken,
  getDeviceSecret,
  getDeviceUid,
  setApiBase,
  setAuthToken,
  setDeviceSecret,
  setDeviceUid,
} from '../../lib/storage';
import type { Business } from '../../lib/types';

export default function SettingsScreen() {
  const { active, updateBusiness, addBusiness } = useApp();
  const [greeting, setGreeting] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [escalation, setEscalation] = useState('');
  const [limit, setLimit] = useState('40');
  const [suggested, setSuggested] = useState('25');
  const [provider, setProvider] = useState<'phone' | 'twilio'>('phone');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [apiBase, setApiBaseState] = useState('https://aibhive.com');
  const [token, setToken] = useState('');
  const [deviceSecret, setDeviceSecretState] = useState('');
  const [deviceUid, setDeviceUidState] = useState('');
  const [serverStatus, setServerStatus] = useState('');
  const [agentOn, setAgentOn] = useState(true);
  const [automationOn, setAutomationOn] = useState(true);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!active) return;
    setGreeting(active.greeting || '');
    setKnowledge(active.knowledge || '');
    setEscalation(active.escalationMessage || '');
    setLimit(String(active.dailySmsLimit || 40));
    setSuggested(String(active.dailySmsSuggested || 25));
    setProvider(active.smsProvider || 'phone');
    setTwilioSid(active.twilioSid || '');
    setTwilioFrom(active.twilioFrom || '');
    setAgentOn(active.agentEnabled !== false);
    setAutomationOn(active.automationEnabled !== false);
  }, [active?.id]);

  useEffect(() => {
    void (async () => {
      setApiBaseState(await getApiBase());
      setToken((await getAuthToken()) || '');
      setDeviceSecretState((await getDeviceSecret()) || '');
      setDeviceUidState((await getDeviceUid()) || '');
    })();
  }, []);

  const save = async () => {
    if (!active) return;
    const patch: Partial<Business> = {
      greeting,
      knowledge,
      escalationMessage: escalation,
      dailySmsLimit: Number(limit) || 40,
      dailySmsSuggested: Number(suggested) || 25,
      smsProvider: provider,
      twilioSid,
      twilioFrom,
      agentEnabled: agentOn,
      automationEnabled: automationOn,
    };
    await updateBusiness(patch);
    try {
      await saveBusiness(active.id, { ...patch, twilioToken: twilioToken || undefined });
    } catch {
      /* local-only ok */
    }
    await setApiBase(apiBase);
    await setAuthToken(token || null);
    await setDeviceSecret(deviceSecret || null);
    await setDeviceUid(deviceUid || null);
    setServerStatus('Saved.');
  };

  const testServer = async () => {
    setServerStatus('Checking…');
    try {
      await setApiBase(apiBase);
      await setDeviceSecret(deviceSecret || null);
      const h = await checkLeadAgentHealth();
      if (!h.ok) throw new Error('health failed');
      setServerStatus(h.grok ? 'Server OK · Grok configured' : 'Server OK · add XAI_API_KEY on server for Grok');
    } catch (e) {
      setServerStatus(String(e));
    }
  };

  const refreshRag = async () => {
    if (!active) return;
    setServerStatus('Refreshing website RAG…');
    try {
      const r = await refreshBusinessRag(active.id);
      setServerStatus(`RAG refreshed (${r.chars} chars)`);
    } catch (e) {
      setServerStatus(String(e));
    }
  };

  const createBusiness = async () => {
    if (!newName.trim()) return;
    const id = `custom-${Date.now()}`;
    const b: Business = {
      id,
      name: newName.trim(),
      brandColor: '#64748b',
      dailySmsLimit: 30,
      dailySmsSuggested: 20,
      smsProvider: 'phone',
      agentEnabled: true,
      greeting: 'Hi — following up. Do you have a moment?',
      knowledge: '',
    };
    await addBusiness(b);
    setNewName('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings · {active?.name}</Text>
      <Text style={styles.label}>Greeting (first SMS)</Text>
      <TextInput style={styles.area} multiline value={greeting} onChangeText={setGreeting} />
      <Text style={styles.label}>AI training / company knowledge</Text>
      <TextInput style={styles.area} multiline value={knowledge} onChangeText={setKnowledge} />
      <Text style={styles.label}>Escalation message (appointment / hot lead)</Text>
      <TextInput style={styles.area} multiline value={escalation} onChangeText={setEscalation} />
      <View style={styles.row}>
        <Text>Agent auto-reply (Grok inbound)</Text>
        <Switch value={agentOn} onValueChange={setAgentOn} />
      </View>
      <View style={styles.row}>
        <Text>Cold outbound automation</Text>
        <Switch value={automationOn} onValueChange={setAutomationOn} />
      </View>
      <Text style={styles.label}>Daily SMS max (avoid blacklist)</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={limit} onChangeText={setLimit} />
      <Text style={styles.label}>Suggested daily sends</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={suggested} onChangeText={setSuggested} />
      <Text style={styles.label}>SMS provider</Text>
      <View style={styles.row}>
        <Pressable style={[styles.chip, provider === 'phone' && styles.chipOn]} onPress={() => setProvider('phone')}>
          <Text>My cell phone</Text>
        </Pressable>
        <Pressable style={[styles.chip, provider === 'twilio' && styles.chipOn]} onPress={() => setProvider('twilio')}>
          <Text>Twilio</Text>
        </Pressable>
      </View>
      {provider === 'twilio' ? (
        <>
          <TextInput style={styles.input} placeholder="Twilio Account SID" value={twilioSid} onChangeText={setTwilioSid} />
          <TextInput style={styles.input} placeholder="Twilio From Number" value={twilioFrom} onChangeText={setTwilioFrom} />
          <TextInput style={styles.input} placeholder="Twilio Auth Token" secureTextEntry value={twilioToken} onChangeText={setTwilioToken} />
        </>
      ) : null}
      <Text style={styles.section}>Server (required for Grok + website RAG)</Text>
      <Text style={styles.hint}>
        Set the same device secret on aibhive.com as LEAD_AGENT_DEVICE_SECRET. Owner UID is your Firebase user id
        (LEAD_AGENT_OWNER_UID).
      </Text>
      <TextInput style={styles.input} placeholder="API base URL" value={apiBase} onChangeText={setApiBaseState} />
      <TextInput
        style={styles.input}
        placeholder="Device secret (X-Lead-Agent-Secret)"
        secureTextEntry
        value={deviceSecret}
        onChangeText={setDeviceSecretState}
      />
      <TextInput
        style={styles.input}
        placeholder="Owner Firebase UID (optional if set on server)"
        autoCapitalize="none"
        value={deviceUid}
        onChangeText={setDeviceUidState}
      />
      <TextInput style={styles.input} placeholder="Firebase auth token (optional)" value={token} onChangeText={setToken} />
      <View style={styles.row}>
        <Pressable style={styles.chip} onPress={testServer}>
          <Text>Test server</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={refreshRag}>
          <Text>Refresh RAG</Text>
        </Pressable>
      </View>
      {serverStatus ? <Text style={styles.hint}>{serverStatus}</Text> : null}
      <Pressable style={styles.save} onPress={save}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
      <Text style={styles.section}>Add business</Text>
      <TextInput style={styles.input} placeholder="Business name" value={newName} onChangeText={setNewName} />
      <Pressable style={styles.save} onPress={createBusiness}>
        <Text style={styles.saveText}>Create business</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 48, paddingBottom: 40, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  area: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  chip: { padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 },
  chipOn: { backgroundColor: '#bbf7d0' },
  section: { fontWeight: '800', marginTop: 24, marginBottom: 8 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 8, lineHeight: 18 },
  save: { backgroundColor: '#1e4d2b', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  saveText: { color: '#fff', fontWeight: '700' },
});
