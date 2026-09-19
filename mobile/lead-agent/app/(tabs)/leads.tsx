import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { normalizePhone } from '../../lib/api';
import { useApp } from '../../lib/context';
import type { Lead } from '../../lib/types';

export default function LeadsScreen() {
  const { active, leads, upsertLead } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const addLead = async () => {
    if (!phone.trim()) return;
    const lead: Lead = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      phone: normalizePhone(phone),
      notes: notes.trim(),
      status: 'new',
      talkedTo: false,
      agentPaused: false,
    };
    await upsertLead(lead);
    setName('');
    setPhone('');
    setNotes('');
  };

  const toggleTalked = async (lead: Lead) => {
    await upsertLead({ ...lead, talkedTo: !lead.talkedTo });
  };

  const togglePause = async (lead: Lead) => {
    await upsertLead({ ...lead, agentPaused: !lead.agentPaused });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{active?.name || 'Leads'}</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Notes / property" value={notes} onChangeText={setNotes} />
        <Pressable style={[styles.addBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]} onPress={addLead}>
          <Text style={styles.addText}>Add lead</Text>
        </Pressable>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || 'Unknown'}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.meta}>
                {item.status} {item.talkedTo ? '· talked' : ''} {item.needsHuman ? '· NEEDS YOU' : ''}
              </Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
            <Pressable style={styles.chip} onPress={() => toggleTalked(item)}>
              <Text>{item.talkedTo ? 'Talked' : 'Not yet'}</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => togglePause(item)}>
              <Text>{item.agentPaused ? 'Paused' : 'Agent on'}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No leads yet — add from your list.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  form: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  addBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  name: { fontWeight: '700' },
  phone: { color: '#555' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  notes: { fontSize: 12, color: '#444', marginTop: 4 },
  chip: { backgroundColor: '#e2e8f0', padding: 8, borderRadius: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 24 },
});
