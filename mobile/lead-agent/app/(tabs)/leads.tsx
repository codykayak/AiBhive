import { useMemo, useState } from 'react';

import {

  Alert,

  FlatList,

  Modal,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  View,

} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import * as FileSystem from 'expo-file-system';

import { normalizePhone } from '../../lib/api';

import { useApp } from '../../lib/context';

import { parseLeadCsv, parsedRowsToLeads } from '../../lib/leadCsvImport';

import { personalizeOutbound } from '../../lib/outboundMessage';
import type { Lead } from '../../lib/types';



export default function LeadsScreen() {

  const { active, leads, upsertLead, importLeads } = useApp();

  const [name, setName] = useState('');

  const [phone, setPhone] = useState('');

  const [propertyAddress, setPropertyAddress] = useState('');

  const [pasteOpen, setPasteOpen] = useState(false);

  const [pasteText, setPasteText] = useState('');

  const [importStatus, setImportStatus] = useState('');



  const preview = useMemo(() => {

    if (!active || leads.length === 0) return '';

    const sample = leads.find((l) => l.status === 'new' || !l.status) || leads[0];

    return personalizeOutbound(active, sample);

  }, [active, leads]);



  const addLead = async () => {

    if (!phone.trim() || !propertyAddress.trim()) {

      Alert.alert('Need phone + property address', 'MacroREI texts reference the property address.');

      return;

    }

    const lead: Lead = {

      id: `local-${Date.now()}`,

      name: name.trim(),

      phone: normalizePhone(phone),

      propertyAddress: propertyAddress.trim(),

      notes: propertyAddress.trim(),

      status: 'new',

      talkedTo: false,

      agentPaused: false,

    };

    await upsertLead(lead);

    setName('');

    setPhone('');

    setPropertyAddress('');

  };



  const runImport = async (text: string) => {

    const parsed = parseLeadCsv(text);

    if (parsed.errors.length && !parsed.rows.length) {

      Alert.alert('Import failed', parsed.errors.join('\n'));

      return;

    }

    const batch = parsedRowsToLeads(parsed.rows);

    const { added, total } = await importLeads(batch);

    setImportStatus(`Imported ${added} new (${total} total). Skipped ${parsed.skipped} bad rows.`);

    setPasteOpen(false);

    setPasteText('');

  };



  const pickCsvFile = async () => {

    try {

      const result = await DocumentPicker.getDocumentAsync({

        type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'],

        copyToCacheDirectory: true,

      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);

      await runImport(text);

    } catch (e) {

      Alert.alert('Could not read file', String(e));

    }

  };



  const toggleTalked = async (lead: Lead) => {

    await upsertLead({ ...lead, talkedTo: !lead.talkedTo });

  };



  const togglePause = async (lead: Lead) => {

    await upsertLead({ ...lead, agentPaused: !lead.agentPaused });

  };



  const newCount = leads.filter((l) => l.status === 'new' || !l.status).length;



  return (

    <View style={styles.container}>

      <Text style={styles.title}>MacroREI leads</Text>

      <Text style={styles.sub}>

        Upload your owner list (CSV). Each row needs homeowner name, property address, and phone. {newCount} ready to

        text.

      </Text>



      <View style={styles.importRow}>

        <Pressable style={[styles.importBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]} onPress={pickCsvFile}>

          <Text style={styles.importBtnText}>Upload CSV</Text>

        </Pressable>

        <Pressable style={styles.importBtnOutline} onPress={() => setPasteOpen(true)}>

          <Text style={styles.importBtnOutlineText}>Paste CSV</Text>

        </Pressable>

      </View>

      {importStatus ? <Text style={styles.status}>{importStatus}</Text> : null}



      {preview ? (

        <View style={styles.previewBox}>

          <Text style={styles.previewLabel}>Sample SMS (next new lead)</Text>

          <Text style={styles.previewBody}>{preview}</Text>

        </View>

      ) : null}



      <Text style={styles.section}>Add one lead</Text>

      <View style={styles.form}>

        <TextInput style={styles.input} placeholder="Homeowner name(s)" value={name} onChangeText={setName} />

        <TextInput

          style={styles.input}

          placeholder="Property address"

          value={propertyAddress}

          onChangeText={setPropertyAddress}

        />

        <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Pressable style={[styles.addBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]} onPress={addLead}>

          <Text style={styles.addText}>Add lead</Text>

        </Pressable>

      </View>



      <FlatList

        data={leads}

        keyExtractor={(item) => item.id}

        ListHeaderComponent={<Text style={styles.section}>Your list ({leads.length})</Text>}

        renderItem={({ item }) => (

          <View style={styles.row}>

            <View style={{ flex: 1 }}>

              <Text style={styles.name}>{item.name || 'Unknown owner'}</Text>

              <Text style={styles.addr}>{item.propertyAddress || item.notes || '— no address —'}</Text>

              <Text style={styles.phone}>{item.phone}</Text>

              <Text style={styles.meta}>

                {item.status || 'new'} {item.talkedTo ? '· talked' : ''} {item.needsHuman ? '· NEEDS YOU' : ''}

              </Text>

            </View>

            <Pressable style={styles.chip} onPress={() => toggleTalked(item)}>

              <Text>{item.talkedTo ? 'Talked' : 'Not yet'}</Text>

            </Pressable>

            <Pressable style={styles.chip} onPress={() => togglePause(item)}>

              <Text>{item.agentPaused ? 'Paused' : 'Agent on'}</Text>

            </Pressable>

          </View>

        )}

        ListEmptyComponent={

          <Text style={styles.empty}>No leads — upload a CSV with columns like Name, Property Address, Phone.</Text>

        }

      />



      <Modal visible={pasteOpen} animationType="slide">

        <ScrollView contentContainerStyle={styles.modal}>

          <Text style={styles.title}>Paste CSV</Text>

          <Text style={styles.sub}>

            Example header: Owner Name, Property Address, Phone{'\n'}Or three columns without a header row.

          </Text>

          <TextInput

            style={styles.pasteArea}

            multiline

            value={pasteText}

            onChangeText={setPasteText}

            placeholder="Owner,123 Main St Eugene OR,5415551234"

          />

          <Pressable

            style={[styles.importBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]}

            onPress={() => void runImport(pasteText)}

          >

            <Text style={styles.importBtnText}>Import</Text>

          </Pressable>

          <Pressable style={styles.importBtnOutline} onPress={() => setPasteOpen(false)}>

            <Text style={styles.importBtnOutlineText}>Cancel</Text>

          </Pressable>

        </ScrollView>

      </Modal>

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#f8fafc' },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },

  sub: { color: '#555', marginBottom: 12, lineHeight: 20 },

  section: { fontWeight: '800', marginTop: 12, marginBottom: 8 },

  importRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },

  importBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },

  importBtnText: { color: '#fff', fontWeight: '700' },

  importBtnOutline: {

    flex: 1,

    padding: 12,

    borderRadius: 8,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#1e4d2b',

  },

  importBtnOutlineText: { color: '#1e4d2b', fontWeight: '700' },

  status: { color: '#166534', marginBottom: 8, fontSize: 13 },

  previewBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#1e4d2b' },

  previewLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },

  previewBody: { color: '#111', lineHeight: 20 },

  form: { marginBottom: 8 },

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

  addr: { color: '#334155', marginTop: 2, fontSize: 13 },

  phone: { color: '#555' },

  meta: { fontSize: 12, color: '#888', marginTop: 2 },

  chip: { backgroundColor: '#e2e8f0', padding: 8, borderRadius: 8 },

  empty: { color: '#888', textAlign: 'center', marginTop: 24, lineHeight: 20 },

  modal: { padding: 20, paddingTop: 56, backgroundColor: '#fff', flexGrow: 1 },

  pasteArea: {

    borderWidth: 1,

    borderColor: '#ddd',

    borderRadius: 8,

    padding: 12,

    minHeight: 200,

    textAlignVertical: 'top',

    marginBottom: 12,

  },

});


