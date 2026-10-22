import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatPhoneDisplay, normalizePhone, postInbound, reportDeviceSent } from '../../lib/api';
import { dialPhoneForLead, googleMapsUrl, leadPhoneList, zillowUrl } from '../../lib/leadPhones';
import { useApp } from '../../lib/context';
import { automationLeadPool, personalizeOutbound } from '../../lib/localAutomation';
import { sendSmsNative, subscribeInbound } from '../../lib/sms';

export default function DialerScreen() {
  const { active, leads, upsertLead, reloadLeads } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(active?.greeting || '');
  const [status, setStatus] = useState('');

  useFocusEffect(
    useCallback(() => {
      void reloadLeads();
    }, [reloadLeads]),
  );

  useEffect(() => {
    setMessage(active?.greeting || '');
  }, [active?.id]);

  useEffect(() => {
    if (!active) return;
    return subscribeInbound(async ({ from, body }) => {
      setStatus(`Inbound from ${from}`);
      try {
        const lead = leads.find((l) => normalizePhone(l.phone) === normalizePhone(from));
        const res = await postInbound(active.id, from, body, lead?.id);
        if (res.reply) {
          await sendSmsNative(from, res.reply);
          setStatus(`Grok replied to ${formatPhoneDisplay(from)}`);
        }
      } catch (e) {
        setStatus(String(e));
      }
    });
  }, [active?.id, leads]);

  const queue = active ? automationLeadPool(leads) : [];

  const [selectedLead, setSelectedLead] = useState<(typeof queue)[0] | null>(null);

  const selectLead = (lead: (typeof queue)[0]) => {
    setSelectedLead(lead);
    const dial = dialPhoneForLead(lead);
    setPhone(formatPhoneDisplay(dial));
    if (active) {
      setMessage(personalizeOutbound(active, lead));
    }
    const extra = leadPhoneList(lead).length > 1 ? ` · line ${(lead.dialPhoneIndex ?? 0) + 1}/${leadPhoneList(lead).length}` : '';
    setStatus(`Loaded ${lead.name || 'owner'}${extra}`);
  };

  const dial = () => Linking.openURL(`tel:${normalizePhone(phone)}`);

  const copyPhone = async () => {
    const raw = normalizePhone(phone);
    if (!raw) return;
    await Share.share({ message: raw });
  };

  const openMaps = (address: string) => {
    const url = googleMapsUrl(address);
    if (url) void Linking.openURL(url);
  };
  const send = async () => {
    if (!active || !phone || !message) return;
    const norm = normalizePhone(phone);
    let lead = leads.find((l) => normalizePhone(l.phone) === norm);
    if (!lead) {
      lead = {
        id: `local-${Date.now()}`,
        phone: norm,
        name: '',
        status: 'new',
        talkedTo: false,
      };
    }
    try {
      if (active.smsProvider === 'twilio') {
        await import('../../lib/api').then((m) => m.sendLeadSms(active.id, lead!.id, message));
      } else {
        await sendSmsNative(norm, message);
        try {
          await reportDeviceSent(active.id, lead.id, norm, message);
        } catch {
          /* offline ok */
        }
      }
      await upsertLead({
        ...lead,
        status: 'texted',
        lastContactAt: new Date().toISOString(),
      });
      setStatus('Sent');
      setPhone('');
    } catch (e) {
      setStatus(String(e));
    }
  };

  if (!active) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>Select a business</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.biz}>{active.name}</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.switch}>Switch</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>From your list ({queue.length} ready)</Text>
      {queue.length === 0 ? (
        <Text style={styles.empty}>
          No leads loaded — import a spreadsheet on the Leads tab (needs phone + property address columns).
        </Text>
      ) : (
        <FlatList
          style={styles.queueList}
          data={queue.slice(0, 80)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.queueRow} onPress={() => selectLead(item)}>
              <Text style={styles.queueName}>{item.name || 'Owner'}</Text>
              <Text style={styles.queueAddr}>{item.propertyAddress}</Text>
              <Text style={styles.queuePhone}>{formatPhoneDisplay(dialPhoneForLead(item))}</Text>
              {item.propertyAddress ? (
                <View style={styles.linkRow}>
                  <Pressable onPress={() => openMaps(item.propertyAddress!)}>
                    <Text style={styles.link}>Maps</Text>
                  </Pressable>
                  <Pressable onPress={() => {
                    const z = zillowUrl(item.propertyAddress!);
                    if (z) void Linking.openURL(z);
                  }}>
                    <Text style={styles.link}>Zillow</Text>
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <Text style={styles.section}>Dial / SMS</Text>
      <View style={styles.phoneRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Pressable style={styles.copyBtn} onPress={() => void copyPhone()}>
          <Text style={styles.copyBtnText}>Share #</Text>
        </Pressable>
      </View>
      {selectedLead?.propertyAddress ? (
        <View style={styles.linkRow}>
          <Pressable onPress={() => openMaps(selectedLead.propertyAddress!)}>
            <Text style={styles.link}>Open Maps</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://aibhive.com/employee')}>
            <Text style={styles.link}>Laptop power dialer</Text>
          </Pressable>
        </View>
      ) : null}
      <TextInput
        style={[styles.input, styles.msg]}
        placeholder="Message"
        multiline
        value={message}
        onChangeText={setMessage}
      />
      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.call]} onPress={dial}>
          <Text style={styles.btnText}>Call</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: active.brandColor || '#1e4d2b' }]} onPress={send}>
          <Text style={styles.btnText}>Send SMS</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Provider: {active.smsProvider || 'phone'} · Suggested {active.dailySmsSuggested}/day · max {active.dailySmsLimit}
      </Text>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  biz: { fontSize: 20, fontWeight: '800' },
  switch: { color: '#2563eb' },
  section: { fontWeight: '800', marginTop: 8, marginBottom: 6 },
  empty: { color: '#64748b', marginBottom: 12, lineHeight: 20, fontSize: 13 },
  queueList: { maxHeight: 200, marginBottom: 8 },
  queueRow: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#1e4d2b',
  },
  queueName: { fontWeight: '700' },
  queueAddr: { color: '#475569', fontSize: 12, marginTop: 2 },
  queuePhone: { color: '#64748b', fontSize: 12, marginTop: 2 },
  linkRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  link: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  copyBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  copyBtnText: { fontWeight: '700', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  msg: { marginTop: 12, minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  call: { backgroundColor: '#334155' },
  btnText: { color: '#fff', fontWeight: '700' },
  hint: { marginTop: 16, color: '#666', fontSize: 12 },
  status: { marginTop: 8, color: '#1e4d2b' },
  link: { color: '#2563eb', padding: 24 },
});
