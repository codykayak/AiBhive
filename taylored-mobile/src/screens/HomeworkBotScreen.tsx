import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Download,
  Eye,
  FileText,
  ImagePlus,
  ScanText,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { AppThemeShell } from '../components/AppThemeShell';
import { builtInAppForThemeKey } from '../constants/builtInHiveApps';
import { GOOGLE_AUTH_ENABLED } from '../constants/features';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { openAddCredits } from '../lib/hiveAccount';
import {
  completeHomeworkAssignment,
  deleteHomeworkDocument,
  HomeworkPaymentRequiredError,
  listHomeworkDocuments,
  viewHomeworkDocument,
  type HomeworkDocument,
} from '../lib/homeworkApi';
import { compressAndIngestImages, type OcrFormat, type PickedPageImage } from '../lib/homeworkOcr';
import { downloadRagLibrary, type RagExportFormat } from '../lib/homeworkExport';
import { keyboardAvoidBehavior } from '../hooks/useKeyboardInset';
import { colors, radii, spacing } from '../theme/colors';

const OCR_FORMATS: OcrFormat[] = ['Markdown', 'Plain Text', 'Preserve Layout'];
const EXPORT_FORMATS: { id: RagExportFormat; label: string }[] = [
  { id: 'txt', label: 'TXT' },
  { id: 'md', label: 'Markdown' },
  { id: 'pdf', label: 'PDF' },
];
const MAX_PAGES = 100;

type Step = 'rag' | 'assign';

function handleHomeworkError(err: unknown, fallback: string) {
  if (err instanceof HomeworkPaymentRequiredError) {
    Alert.alert('Hive credits needed', err.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add credits', onPress: () => void openAddCredits() },
    ]);
    return;
  }
  Alert.alert('Error', err instanceof Error ? err.message : fallback);
}

export default function HomeworkBotScreen() {
  const navigation = useNavigation<any>();
  const theme = builtInAppForThemeKey('homework')!;
  const { user, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>('rag');
  const [documents, setDocuments] = useState<HomeworkDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [ocrImages, setOcrImages] = useState<PickedPageImage[]>([]);
  const [ocrTitle, setOcrTitle] = useState('');
  const [ocrFormat, setOcrFormat] = useState<OcrFormat>('Markdown');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportFormat, setExportFormat] = useState<RagExportFormat>('txt');
  const [assignmentText, setAssignmentText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [completing, setCompleting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState('');
  const [viewText, setViewText] = useState('');
  const [viewLoading, setViewLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      setDocuments(await listHomeworkDocuments());
    } catch (err) {
      handleHomeworkError(err, 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const addImages = (assets: Array<{ uri: string; fileName?: string | null }>) => {
    const incoming = assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName || `page-${ocrImages.length + i + 1}.jpg`,
    }));
    setOcrImages((prev) => {
      const merged = [...prev, ...incoming];
      return merged.length > MAX_PAGES ? merged.slice(0, MAX_PAGES) : merged;
    });
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add page images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.min(50, MAX_PAGES - ocrImages.length),
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) addImages(result.assets);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph pages.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets?.[0]) addImages(result.assets);
  };

  const handleOcrIngest = async () => {
    if (!ocrImages.length) {
      Alert.alert('Add pages', 'Select or photograph at least one page image.');
      return;
    }
    setOcrBusy(true);
    setOcrProgress(0);
    setOcrStatus('');
    try {
      await compressAndIngestImages(ocrImages, {
        format: ocrFormat,
        title: ocrTitle.trim() || undefined,
        onProgress: (pct, label) => {
          setOcrProgress(pct);
          setOcrStatus(label);
        },
      });
      setOcrImages([]);
      setOcrTitle('');
      setOcrStatus('');
      await loadDocuments();
    } catch (err) {
      handleHomeworkError(err, 'OCR failed');
    } finally {
      setOcrBusy(false);
      setOcrProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete document?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHomeworkDocument(id);
            await loadDocuments();
          } catch (err) {
            handleHomeworkError(err, 'Delete failed');
          }
        },
      },
    ]);
  };

  const openView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewText('');
    setViewTitle('');
    try {
      const doc = await viewHomeworkDocument(id);
      setViewTitle(doc.title);
      setViewText(doc.text);
    } catch (err) {
      setViewText(err instanceof Error ? err.message : 'Could not load document');
    } finally {
      setViewLoading(false);
    }
  };

  const handleExport = async () => {
    setExportBusy(true);
    try {
      await downloadRagLibrary(exportFormat);
    } catch (err) {
      handleHomeworkError(err, 'Export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const handleComplete = async (assignmentUri?: string, assignmentName?: string, assignmentMimeType?: string) => {
    if (!assignmentText.trim() && !assignmentUri) {
      Alert.alert('Assignment required', 'Paste questions or upload an assignment file.');
      return;
    }
    if (!documents.length) {
      Alert.alert('Build your library first', 'OCR reference pages in Step 1 before completing an assignment.');
      return;
    }
    setCompleting(true);
    setAnswer('');
    try {
      const result = await completeHomeworkAssignment({
        assignmentText: assignmentText.trim() || undefined,
        customPrompt: customPrompt.trim() || undefined,
        assignmentUri,
        assignmentName,
        assignmentMimeType,
      });
      setAnswer(result.text);
    } catch (err) {
      handleHomeworkError(err, 'Completion failed');
    } finally {
      setCompleting(false);
    }
  };

  const pickAssignmentFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/pdf', 'text/markdown'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const file = result.assets[0];
      void handleComplete(file.uri, file.name, file.mimeType || 'text/plain');
    }
  };

  const totalChars = documents.reduce((sum, d) => sum + (d.chars || 0), 0);
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 0), 0);

  const openWebHomework = () =>
    navigation.navigate('HiveAppWebView', {
      runnerId: 'example-homework-bot',
      title: 'Homework Bot',
    });

  const handleSignIn = () => {
    if (GOOGLE_AUTH_ENABLED) {
      void signInWithGoogle();
      return;
    }
    openWebHomework();
  };

  if (!user) {
    return (
      <AppThemeShell theme={theme} subtitle="Sign in to build your private reference library.">
        <View style={styles.signInBox}>
          <Text style={[styles.signInTitle, { color: theme.accentText }]}>Homework Bot</Text>
          <Text style={styles.signInBody}>
            OCR your reference pages into a private library, then complete assignments with Grok. Your
            documents are isolated to your account. OCR and completion use Hive credits.
          </Text>
          <PrimaryButton
            label={GOOGLE_AUTH_ENABLED ? 'Sign in with Google' : 'Sign in with Google (web)'}
            onPress={handleSignIn}
          />
          {!GOOGLE_AUTH_ENABLED ? (
            <Text style={styles.signInHint}>
              Opens the web Homework Bot in-app so Google sign-in works on this device.
            </Text>
          ) : null}
        </View>
      </AppThemeShell>
    );
  }

  return (
    <AppThemeShell
      theme={theme}
      subtitle="OCR pages → private RAG → Grok completes assignments from your library."
    >
      <KeyboardAvoidingView style={styles.flex} behavior={keyboardAvoidBehavior}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepRow}>
            <TouchableOpacity
              style={[styles.stepBtn, step === 'rag' && { backgroundColor: theme.primary }]}
              onPress={() => setStep('rag')}
            >
              <ScanText color={step === 'rag' ? '#111' : theme.accentText} size={16} />
              <Text style={[styles.stepLabel, step === 'rag' && styles.stepLabelActive]}>1 · RAG library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, step === 'assign' && { backgroundColor: theme.primary }]}
              onPress={() => setStep('assign')}
            >
              <Sparkles color={step === 'assign' ? '#111' : theme.accentText} size={16} />
              <Text style={[styles.stepLabel, step === 'assign' && styles.stepLabelActive]}>2 · Assignment</Text>
            </TouchableOpacity>
          </View>

          {step === 'rag' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload page photos</Text>
              <Text style={styles.hint}>Batch OCR saves text to your private library. Uses Hive credits.</Text>

              <TextInput
                style={[styles.input, { borderColor: theme.primary + '44' }]}
                placeholder="Batch title (optional)"
                placeholderTextColor={colors.textDim}
                value={ocrTitle}
                onChangeText={setOcrTitle}
                editable={!ocrBusy}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatRow}>
                {OCR_FORMATS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, ocrFormat === f && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                    onPress={() => setOcrFormat(f)}
                  >
                    <Text style={[styles.chipText, ocrFormat === f && { color: theme.accentText }]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.pickRow}>
                <TouchableOpacity style={styles.pickBtn} onPress={() => void pickFromLibrary()} disabled={ocrBusy}>
                  <ImagePlus color={theme.accentText} size={18} />
                  <Text style={styles.pickText}>Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickBtn} onPress={() => void pickFromCamera()} disabled={ocrBusy}>
                  <Camera color={theme.accentText} size={18} />
                  <Text style={styles.pickText}>Camera</Text>
                </TouchableOpacity>
              </View>

              {ocrImages.length > 0 && (
                <Text style={styles.hint}>{ocrImages.length} page{ocrImages.length === 1 ? '' : 's'} selected</Text>
              )}

              {ocrBusy && (
                <View style={styles.progressBox}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${ocrProgress}%`, backgroundColor: theme.primary }]} />
                  </View>
                  <Text style={styles.hint}>{ocrStatus || 'Processing…'}</Text>
                </View>
              )}

              <PrimaryButton
                label={ocrBusy ? 'OCR in progress…' : `OCR ${ocrImages.length || ''} pages → save`}
                onPress={() => void handleOcrIngest()}
                disabled={ocrBusy || ocrImages.length === 0}
                style={{ backgroundColor: theme.primary }}
              />

              <View style={[styles.libraryCard, { borderColor: theme.primary + '33' }]}>
                <View style={styles.libraryHead}>
                  <Text style={styles.sectionTitle}>Your RAG library</Text>
                  {loadingDocs && <ActivityIndicator color={theme.primary} size="small" />}
                </View>
                {documents.length > 0 && (
                  <View style={styles.exportRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {EXPORT_FORMATS.map((f) => (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.chip, exportFormat === f.id && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                          onPress={() => setExportFormat(f.id)}
                        >
                          <Text style={[styles.chipText, exportFormat === f.id && { color: theme.accentText }]}>{f.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.exportBtn} onPress={() => void handleExport()} disabled={exportBusy}>
                      {exportBusy ? (
                        <ActivityIndicator color={theme.accentText} size="small" />
                      ) : (
                        <Download color={theme.accentText} size={18} />
                      )}
                      <Text style={[styles.exportText, { color: theme.accentText }]}>Download all</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {documents.length === 0 && !loadingDocs ? (
                  <Text style={styles.hint}>No documents yet. OCR page images above.</Text>
                ) : (
                  documents.map((doc) => (
                    <View key={doc.id} style={styles.docRow}>
                      <View style={styles.docCopy}>
                        <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                        <Text style={styles.hint}>
                          {doc.pageCount ? `${doc.pageCount} pages · ` : ''}
                          {doc.chars.toLocaleString()} chars
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => void openView(doc.id)} style={styles.iconBtn}>
                        <Eye color={theme.accentText} size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => void handleDelete(doc.id)} style={styles.iconBtn}>
                        <Trash2 color="#f87171" size={18} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {documents.length > 0 && (
                <PrimaryButton
                  label="Continue to assignment"
                  onPress={() => setStep('assign')}
                  style={{ backgroundColor: theme.primarySoft }}
                />
              )}
            </View>
          )}

          {step === 'assign' && (
            <View style={styles.section}>
              <View style={[styles.ragBanner, { borderColor: theme.primary + '44', backgroundColor: theme.primarySoft }]}>
                <FileText color={theme.accentText} size={18} />
                <Text style={styles.ragBannerText}>
                  Grok uses your library — {documents.length} doc{documents.length === 1 ? '' : 's'}
                  {totalPages > 0 ? `, ${totalPages} OCR pages` : ''}, {totalChars.toLocaleString()} chars.
                </Text>
              </View>

              <Text style={styles.label}>Custom instructions (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: theme.primary + '44' }]}
                placeholder="Tone, length, citation style…"
                placeholderTextColor={colors.textDim}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
              />

              <Text style={styles.label}>Assignment</Text>
              <TextInput
                style={[styles.input, styles.textAreaTall, { borderColor: theme.primary + '44' }]}
                placeholder="Paste homework questions here…"
                placeholderTextColor={colors.textDim}
                value={assignmentText}
                onChangeText={setAssignmentText}
                multiline
              />

              <View style={styles.actionRow}>
                <PrimaryButton
                  label={completing ? 'Working…' : 'Complete with Grok'}
                  onPress={() => void handleComplete()}
                  disabled={completing || documents.length === 0}
                  style={{ flex: 1, backgroundColor: theme.primary }}
                />
                <TouchableOpacity style={styles.fileBtn} onPress={() => void pickAssignmentFile()} disabled={completing}>
                  <FileText color={theme.accentText} size={18} />
                  <Text style={[styles.fileBtnText, { color: theme.accentText }]}>Upload file</Text>
                </TouchableOpacity>
              </View>

              {!!answer && (
                <View style={[styles.answerCard, { borderColor: theme.primary + '44' }]}>
                  <View style={styles.answerHead}>
                    <Text style={styles.sectionTitle}>Answer</Text>
                    <TouchableOpacity onPress={() => void Clipboard.setStringAsync(answer)}>
                      <Text style={[styles.copyLink, { color: theme.accentText }]}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.answerText}>{answer}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={viewOpen} animationType="slide" onRequestClose={() => setViewOpen(false)}>
        <View style={[styles.modal, { backgroundColor: theme.bg }]}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, { color: theme.accentText }]} numberOfLines={1}>{viewTitle || 'Document'}</Text>
            <TouchableOpacity onPress={() => setViewOpen(false)}>
              <Text style={[styles.copyLink, { color: theme.accentText }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {viewLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.answerText}>{viewText}</Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </AppThemeShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  signInBox: { padding: spacing.xl, gap: spacing.lg },
  signInTitle: { fontSize: 24, fontWeight: '800' },
  signInBody: { color: colors.textMuted, lineHeight: 22 },
  signInHint: { color: colors.textDim, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepLabel: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  stepLabelActive: { color: '#111' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  label: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  textAreaTall: { minHeight: 140, textAlignVertical: 'top' },
  formatRow: { marginVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  pickRow: { flexDirection: 'row', gap: spacing.sm },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pickText: { color: colors.text, fontWeight: '600' },
  progressBox: { gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%' },
  libraryCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  libraryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exportRow: { gap: spacing.sm, marginBottom: spacing.sm },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  exportText: { fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  docCopy: { flex: 1 },
  docTitle: { color: colors.text, fontWeight: '700' },
  iconBtn: { padding: 8 },
  ragBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  ragBannerText: { flex: 1, color: colors.textMuted, lineHeight: 20, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fileBtnText: { fontWeight: '700', fontSize: 13 },
  answerCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  answerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copyLink: { fontWeight: '700' },
  answerText: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
  modal: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 24 },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '800', marginRight: spacing.md },
  modalBody: { padding: spacing.lg },
});
