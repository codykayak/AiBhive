import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Share2,
  FileText,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { HiveOrb } from '../components/HiveOrb';
import { IntelDorkLinks } from '../components/IntelDorkLinks';
import { colors, radii, spacing } from '../theme/colors';
import { getIntelCase } from '../osint/cases';
import { runIntelAgent } from '../osint/agent';
import { formatRegionLabel } from '../osint/regionalQuery';
import { buildJsonExport, buildRawDump, buildShareSummary } from '../osint/export';
import { shareIntelPdf } from '../osint/pdfExport';
import { getToolDef } from '../osint/tools/registry';
import type { AgentProgressEvent, IntelCase, ToolRunResult } from '../osint/types';

function StatusIcon({ status }: { status: ToolRunResult['status'] }) {
  if (status === 'running') return <Loader2 color={colors.amber} size={18} />;
  if (status === 'done') return <CheckCircle2 color={colors.success} size={18} />;
  if (status === 'error') return <XCircle color={colors.danger} size={18} />;
  return <Circle color={colors.textDim} size={18} />;
}

export default function IntelCaseScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { caseId, autoRun } = route.params ?? {};
  const [intelCase, setIntelCase] = useState<IntelCase | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const autoStarted = useRef(false);

  const load = useCallback(async () => {
    if (!caseId) return;
    const c = await getIntelCase(caseId);
    setIntelCase(c);
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onProgress = useCallback((event: AgentProgressEvent) => {
    if (event.type === 'status') setStatusMessage(event.message);
    if (event.type === 'tool_done') {
      setIntelCase((prev) => {
        if (!prev) return prev;
        const others = prev.toolResults.filter((r) => r.toolId !== event.result.toolId);
        return { ...prev, toolResults: [...others, event.result] };
      });
    }
    if (event.type === 'plan') {
      setIntelCase((prev) => (prev ? { ...prev, plan: event.plan } : prev));
    }
    if (event.type === 'brief') {
      setIntelCase((prev) =>
        prev ? { ...prev, aiBrief: event.brief, rawDump: event.rawDump, status: 'complete' } : prev
      );
    }
  }, []);

  const runAgent = useCallback(async () => {
    if (!caseId || running) return;
    setRunning(true);
    setStatusMessage('Starting Intel Agent…');
    try {
      const result = await runIntelAgent(caseId, onProgress);
      setIntelCase(result);
    } catch (err) {
      Alert.alert('Agent error', err instanceof Error ? err.message : 'Research failed');
    } finally {
      setRunning(false);
      void load();
    }
  }, [caseId, running, onProgress, load]);

  useEffect(() => {
    if (autoRun && intelCase && intelCase.status === 'draft' && !autoStarted.current) {
      autoStarted.current = true;
      void runAgent();
    }
  }, [autoRun, intelCase, runAgent]);

  const exportTxt = async () => {
    if (!intelCase) return;
    const body = buildRawDump(intelCase);
    await Share.share({ message: body, title: `AiBhive Intel — ${intelCase.target.label}` });
  };

  const exportJson = async () => {
    if (!intelCase) return;
    const body = buildJsonExport(intelCase);
    await Share.share({ message: body, title: `AiBhive Intel JSON — ${intelCase.target.label}` });
  };

  const shareSummary = async () => {
    if (!intelCase) return;
    await Share.share({ message: buildShareSummary(intelCase) });
  };

  const exportPdf = async () => {
    if (!intelCase) return;
    try {
      await shareIntelPdf(intelCase);
    } catch (err) {
      Alert.alert('PDF export failed', err instanceof Error ? err.message : 'Could not create PDF');
    }
  };

  const dorkResult = intelCase?.toolResults.find((r) => r.toolId === 'google_dorks' && r.status === 'done');

  if (!intelCase) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  const planSteps = intelCase.plan?.steps ?? [];
  const resultsByTool = new Map(intelCase.toolResults.map((r) => [r.toolId, r]));

  const typeLabel =
    intelCase.target.type === 'domain'
      ? 'Website'
      : intelCase.target.type === 'person'
        ? 'Person'
        : 'Company';
  const regionLabel = formatRegionLabel(intelCase.target.region);
  const caseSubtitle = regionLabel
    ? `${typeLabel} · ${regionLabel}`
    : `${typeLabel} research`;

  return (
    <ScreenLayout title={intelCase.target.label} subtitle={caseSubtitle} compactBadge>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {running && (
          <View style={styles.orbWrap}>
            <HiveOrb size={72} active />
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusBadge}>{intelCase.status.toUpperCase()}</Text>
          {intelCase.agentProvider && (
            <Text style={styles.agentMeta}>
              Agent: {intelCase.agentProvider} · {intelCase.agentModel}
            </Text>
          )}
        </View>

        {running && (
          <GlassCard style={styles.progressCard}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.progressText}>{statusMessage || 'Running…'}</Text>
          </GlassCard>
        )}

        {!running && intelCase.status === 'draft' && (
          <PrimaryButton label="Run Intel Agent" onPress={() => void runAgent()} icon={Play} />
        )}

        {intelCase.aiBrief && (
          <>
            <Text style={styles.sectionTitle}>AI Intelligence Brief</Text>
            <GlassCard style={styles.card}>
              <Text style={styles.briefText}>{intelCase.aiBrief}</Text>
            </GlassCard>
            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => void shareSummary()}>
                <Share2 color={colors.black} size={16} />
                <Text style={styles.exportBtnText}>Share summary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={() => void exportTxt()}>
                <FileText color={colors.black} size={16} />
                <Text style={styles.exportBtnText}>TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={() => void exportPdf()}>
                <FileText color={colors.black} size={16} />
                <Text style={styles.exportBtnText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportBtn, styles.exportBtnAlt]} onPress={() => void exportJson()}>
                <FileText color={colors.amberLight} size={16} />
                <Text style={[styles.exportBtnText, styles.exportBtnTextAlt]}>JSON</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {planSteps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Agent plan</Text>
            {planSteps.map((step, i) => {
              const result = resultsByTool.get(step.toolId);
              const status = result?.status ?? (running ? 'pending' : 'pending');
              return (
                <TouchableOpacity
                  key={`${step.toolId}-${i}`}
                  style={styles.toolCard}
                  onPress={() => setExpandedTool(expandedTool === step.toolId ? null : step.toolId)}
                  disabled={!result?.data && !result?.error}
                >
                  <View style={styles.toolHeader}>
                    <StatusIcon status={status} />
                    <View style={styles.toolHeaderText}>
                      <Text style={styles.toolTitle}>{getToolDef(step.toolId).name}</Text>
                      <Text style={styles.toolReason}>{step.reason}</Text>
                      {result?.summary && <Text style={styles.toolSummary}>{result.summary}</Text>}
                    </View>
                    {(result?.data || result?.error) &&
                      (expandedTool === step.toolId ? (
                        <ChevronUp color={colors.textMuted} size={18} />
                      ) : (
                        <ChevronDown color={colors.textMuted} size={18} />
                      ))}
                  </View>
                  {expandedTool === step.toolId && (
                    <Text style={styles.toolData}>{result?.error ?? result?.data}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {dorkResult?.data && <IntelDorkLinks data={dorkResult.data} />}

        {intelCase.rawDump && (
          <>
            <TouchableOpacity style={styles.rawToggle} onPress={() => setShowRaw(!showRaw)}>
              <Text style={styles.sectionTitle}>Full data dump</Text>
              {showRaw ? <ChevronUp color={colors.amber} size={20} /> : <ChevronDown color={colors.amber} size={20} />}
            </TouchableOpacity>
            {showRaw && (
              <GlassCard style={styles.rawCard}>
                <Text style={styles.rawText}>{intelCase.rawDump.slice(0, 50000)}</Text>
              </GlassCard>
            )}
          </>
        )}

        {intelCase.status === 'complete' && !running && (
          <PrimaryButton
            label="Re-run research"
            onPress={() => void runAgent()}
            variant="secondary"
            style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
          />
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  orbWrap: { alignItems: 'center', marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md, flexWrap: 'wrap' },
  statusBadge: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  agentMeta: { color: colors.textMuted, fontSize: 12 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressText: { color: colors.text, flex: 1, fontSize: 14 },
  sectionTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15, marginBottom: 8, marginTop: spacing.sm },
  card: { padding: spacing.md, marginBottom: spacing.md },
  briefText: { color: colors.text, lineHeight: 22, fontSize: 14 },
  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.amber,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  exportBtnAlt: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderMuted },
  exportBtnText: { color: colors.black, fontWeight: '800', fontSize: 12 },
  exportBtnTextAlt: { color: colors.amberLight },
  toolCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  toolHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  toolHeaderText: { flex: 1 },
  toolTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  toolReason: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  toolSummary: { color: colors.success, fontSize: 12, marginTop: 4, fontWeight: '600' },
  toolData: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  rawToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rawCard: { padding: spacing.md, maxHeight: 400 },
  rawText: { color: colors.textMuted, fontSize: 10, fontFamily: 'monospace', lineHeight: 14 },
});
