import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { normalizePhone } from '../../lib/api';
import { useApp } from '../../lib/context';
import {
  importLeadsFromFileUri,
  LEAD_IMPORT_SAMPLE,
  parseLeadCsv,
  parsedRowsToLeads,
} from '../../lib/leadCsvImport';
import { personalizeOutbound } from '../../lib/outboundMessage';
import type { Lead } from '../../lib/types';

const PICK_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function LeadsScreen() {
  const { active, leads, upsertLead, importLeads, workspace, canEditLeads, inviteTeammate, signInWithGoogle } =
    useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState(LEAD_IMPORT_SAMPLE);
  const [importStatus, setImportStatus] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const preview = useMemo(() => {
    if (!active || leads.length === 0) return '';
    const sample = leads.find((l) => l.status === 'new' || !l.status) || leads[0];
    return personalizeOutbound(active, sample);
  }, [active, leads]);

  const newCount = leads.filter((l) => (l.status === 'new' || !l.status) && l.propertyAddress).length;

  const finishImport = async (parsed: ReturnType<typeof parseLeadCsv>) => {
    if (!canEditLeads) {
      Alert.alert('View only', 'You cannot import leads with viewer access.');
      return;
    }
    if (parsed.errors.length && !parsed.rows.length) {
      Alert.alert('Import failed', parsed.errors.join('\n'));
      return;
    }
    const batch = parsedRowsToLeads(parsed.rows);
    const { added, total } = await importLeads(batch);
    const msg = `Added ${added} leads (${total} on device). Skipped ${parsed.skipped} bad rows.`;
    setImportStatus(msg);
    if (added === 0 && parsed.rows.length > 0) {
      Alert.alert('Nothing new added', msg);
    } else if (added === 0 && parsed.errors.length) {
      Alert.alert('Import issue', [...parsed.errors, msg].join('\n'));
    }
    setPasteOpen(false);
  };

  const pickSpreadsheet = async () => {
    if (!canEditLeads) {
      Alert.alert('View only', 'You cannot import leads with viewer access.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICK_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setImportStatus('Reading file…');
      const parsed = await importLeadsFromFileUri(asset.uri, asset.name || 'leads.csv', asset.mimeType);
      await finishImport(parsed);
    } catch (e) {
      Alert.alert('Could not read file', String(e));
      setImportStatus('');
    }
  };

  const addLead = async () => {
    if (!canEditLeads) {
      Alert.alert('View only', 'Ask the workspace owner for editor access to add leads.');
      return;
    }
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
    setImportStatus('Lead saved.');
  };

  const shareInviteLink = async () => {
    const joinUrl = workspace?.joinUrl || 'https://aibhive.com/api/lead-agent/auth/mobile';
    const message =
      workspace?.inviteMessage ||
      `Join our MacroREI marketing list on Lead Agent — sign in with Google: ${joinUrl}`;
    await Share.share({ message, url: joinUrl });
  };

  const sendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email.includes('@')) {
      Alert.alert('Email required', 'Enter your partner’s Google email.');
      return;
    }
    try {
      const result = await inviteTeammate(email);
      setShareOpen(false);
      setInviteEmail('');
      await Share.share({
        message: `${result.message || 'You are invited to view our MacroREI lead list.'}\n${result.joinUrl || workspace?.joinUrl || ''}`,
      });
    } catch (e) {
      Alert.alert('Invite failed', String(e));
    }
  };

  const isOwner = workspace?.role === 'owner';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner list · v{Constants.expoConfig?.version || '1.1'}</Text>
      <Text style={styles.sub}>
        Import CSV or Excel (.xlsx). Columns: homeowner name, property address, phone. {newCount} ready for SMS.
        {workspace?.email ? ` · Signed in as ${workspace.email} (${workspace.role})` : ''}
      </Text>

      <View style={styles.shareRow}>
        {!workspace?.email ? (
          <Pressable style={styles.shareChip} onPress={() => void signInWithGoogle()}>
            <Text style={styles.shareChipText}>Sign in with Google</Text>
          </Pressable>
        ) : null}
        {isOwner ? (
          <Pressable style={styles.shareChip} onPress={() => setShareOpen(true)}>
            <Text style={styles.shareChipText}>Invite partner</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.shareChipSecondary} onPress={() => void shareInviteLink()}>
          <Text style={styles.shareChipSecondaryText}>Share link</Text>
        </Pressable>
      </View>

      {!canEditLeads ? (
        <Text style={styles.viewOnly}>View-only access — you can see the marketing list but not import or edit.</Text>
      ) : null}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Step 1 — load your list</Text>
        <Pressable
          style={[styles.heroBtn, { backgroundColor: active?.brandColor || '#1e4d2b', opacity: canEditLeads ? 1 : 0.45 }]}
          onPress={() => canEditLeads && void pickSpreadsheet()}
          disabled={!canEditLeads}
        >
          <Text style={styles.heroBtnText}>Choose CSV or Excel file</Text>
        </Pressable>
        <Pressable
          style={[styles.heroBtnSecondary, !canEditLeads && { opacity: 0.45 }]}
          onPress={() => canEditLeads && setPasteOpen(true)}
          disabled={!canEditLeads}
        >
          <Text style={styles.heroBtnSecondaryText}>Paste from spreadsheet</Text>
        </Pressable>
        {importStatus ? <Text style={styles.status}>{importStatus}</Text> : null}
      </View>

      {preview ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Sample outbound SMS</Text>
          <Text style={styles.previewBody}>{preview}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Add one owner manually</Text>
      <TextInput style={styles.input} placeholder="Homeowner name(s)" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Property address (required for SMS)"
        value={propertyAddress}
        onChangeText={setPropertyAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Pressable style={[styles.addBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]} onPress={() => void addLead()}>
        <Text style={styles.addText}>Save lead</Text>
      </Pressable>

      <FlatList
        style={styles.list}
        data={leads}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.section}>Loaded leads ({leads.length})</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || 'Owner'}</Text>
              <Text style={styles.addr}>{item.propertyAddress || item.notes || '— missing address —'}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.meta}>{item.status || 'new'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No leads yet — tap “Choose CSV or Excel file” above.</Text>
        }
      />

      <Modal visible={shareOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Invite to marketing list</Text>
            <Text style={styles.sub}>They must sign in with this Google email in Lead Agent.</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@gmail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <Pressable
              style={[styles.heroBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]}
              onPress={() => void sendInvite()}
            >
              <Text style={styles.heroBtnText}>Send invite & share</Text>
            </Pressable>
            <Pressable style={styles.heroBtnSecondary} onPress={() => setShareOpen(false)}>
              <Text style={styles.heroBtnSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={pasteOpen} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>Paste CSV</Text>
          <Text style={styles.sub}>Copy rows from Excel (include a header row).</Text>
          <TextInput
            style={styles.pasteArea}
            multiline
            value={pasteText}
            onChangeText={setPasteText}
          />
          <Pressable
            style={[styles.heroBtn, { backgroundColor: active?.brandColor || '#1e4d2b' }]}
            onPress={() => void finishImport(parseLeadCsv(pasteText))}
          >
            <Text style={styles.heroBtnText}>Import pasted rows</Text>
          </Pressable>
          <Pressable style={styles.heroBtnSecondary} onPress={() => setPasteOpen(false)}>
            <Text style={styles.heroBtnSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  sub: { color: '#475569', marginTop: 6, marginBottom: 12, lineHeight: 20 },
  shareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  shareChip: { backgroundColor: '#1e4d2b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  shareChipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  shareChipSecondary: {
    borderWidth: 1,
    borderColor: '#1e4d2b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareChipSecondaryText: { color: '#1e4d2b', fontWeight: '700', fontSize: 13 },
  viewOnly: { color: '#b45309', marginBottom: 8, lineHeight: 18, fontSize: 13 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1e4d2b',
  },
  heroLabel: { fontWeight: '800', color: '#1e4d2b', marginBottom: 10 },
  heroBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  heroBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  heroBtnSecondary: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e4d2b',
  },
  heroBtnSecondaryText: { color: '#1e4d2b', fontWeight: '700' },
  status: { marginTop: 10, color: '#166534', fontSize: 14 },
  previewBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1e4d2b',
  },
  previewLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  previewBody: { marginTop: 6, lineHeight: 20, color: '#111' },
  section: { fontWeight: '800', marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  addText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1, marginTop: 8 },
  row: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  name: { fontWeight: '700' },
  addr: { color: '#334155', marginTop: 2 },
  phone: { color: '#64748b', marginTop: 2 },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 20, lineHeight: 22 },
  modal: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  pasteArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    maxHeight: 320,
    textAlignVertical: 'top',
    marginVertical: 12,
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
