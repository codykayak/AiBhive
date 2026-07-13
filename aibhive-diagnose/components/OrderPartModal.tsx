import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Link2, Package, ScanLine, X } from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import { scanPartLabel, suggestPart, submitPartRequest } from '@/lib/jobs/partRequests';
import type { OrderPartPrefill } from '@/lib/diagnose/chatIntents';
import type { DiagnosisResult, TradePackId } from '@/lib/packs/types';
import { extractModelCandidates } from '@/lib/knowledge/manualSearch';

type Props = {
  visible: boolean;
  onClose: () => void;
  userQuery: string;
  assistantReply: string;
  structured?: DiagnosisResult;
  jobId?: string;
  jobTitle?: string;
  initialPrefill?: OrderPartPrefill;
  onSubmitted?: () => void;
};

export function OrderPartModal({
  visible,
  onClose,
  userQuery,
  assistantReply,
  structured,
  jobId,
  jobTitle,
  initialPrefill,
  onSubmitted,
}: Props) {
  const { getIdToken, profile, user } = useAuth();
  const { activePack } = usePack();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [partUrl, setPartUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSuccess(false);
    setError(null);
    const hints = structured?.partsToCheck || [];
    const models = extractModelCandidates(userQuery);
    setPartName(hints[0] || initialPrefill?.partName || userQuery.slice(0, 120));
    setPartNumber(initialPrefill?.partNumber || '');
    setQuantity('1');
    setBrand(initialPrefill?.brand || '');
    setEquipmentModel(initialPrefill?.equipmentModel || models[0] || '');
    setPartUrl('');
    setNotes(initialPrefill?.notes || '');

    const hasIntentPrefill = Boolean(
      initialPrefill?.partNumber || initialPrefill?.partName || initialPrefill?.brand
    );

    void (async () => {
      const token = await getIdToken();
      if (!token) return;
      if (hasIntentPrefill && initialPrefill?.partNumber) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const suggestion = await suggestPart(token, {
          userText: userQuery,
          assistantReply,
          packId: activePack.id,
          partsHints: hints,
        });
        if (suggestion.partName) setPartName(suggestion.partName);
        if (suggestion.partNumber) setPartNumber(suggestion.partNumber);
        if (suggestion.brand) setBrand(suggestion.brand);
        if (suggestion.equipmentModel) setEquipmentModel(suggestion.equipmentModel);
        if (suggestion.notes) setNotes(suggestion.notes);
      } catch {
        // keep local defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, userQuery, assistantReply, structured, activePack.id, getIdToken, initialPrefill]);

  const scanLabelPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to scan a part label.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.65,
      base64: true,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    const token = await getIdToken();
    if (!token) {
      setError('Sign in to scan part labels.');
      return;
    }

    setScanning(true);
    setError(null);
    try {
      const scan = await scanPartLabel(token, {
        base64: result.assets[0].base64,
        mimeType: result.assets[0].mimeType || 'image/jpeg',
      });
      if (scan.partNumber) setPartNumber(scan.partNumber);
      if (scan.partName) setPartName(scan.partName);
      if (scan.brand) setBrand(scan.brand);
      if (scan.equipmentModel) setEquipmentModel(scan.equipmentModel);
      if (scan.notes) {
        setNotes((prev) => (prev ? `${prev}\n${scan.notes}` : scan.notes));
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the label. Try again or type manually.');
    } finally {
      setScanning(false);
    }
  };

  const submit = async () => {
    if (!partName.trim()) {
      setError('Describe the part you need.');
      return;
    }
    const token = await getIdToken();
    if (!token || !user) {
      setError('Sign in and join a Pros team to order parts.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPartRequest(token, {
        partName: partName.trim(),
        partNumber: partNumber.trim() || undefined,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        brand: brand.trim() || undefined,
        equipmentModel: equipmentModel.trim() || undefined,
        partUrl: partUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        jobId,
        jobTitle,
        packId: activePack.id as TradePackId,
        diagnoseQuery: userQuery.slice(0, 500),
        requestedByName: profile?.displayName || undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      onSubmitted?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit part request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-hive-bg"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View className="flex-row items-center gap-2">
            <Package color={theme.colors.amber} size={22} />
            <Text className="text-lg font-bold text-hive-mist">Order part</Text>
          </View>
          <Pressable onPress={onClose} className="p-2">
            <X color={theme.colors.steel} size={22} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text className="text-sm text-hive-steel mb-4 leading-5">
            Sends to your shop HQ for approval. Job status updates to{' '}
            <Text className="font-bold text-hive-mist">Needs parts</Text> when linked.
          </Text>

          {loading ? (
            <View className="flex-row items-center gap-2 mb-4">
              <ActivityIndicator color={theme.colors.amber} />
              <Text className="text-sm text-hive-steel">AI suggesting part number…</Text>
            </View>
          ) : null}

          {success ? (
            <View className="rounded-sm border border-hive-success/40 bg-hive-success/10 p-4">
              <Text className="font-bold text-hive-mist">Submitted for approval</Text>
              <Text className="text-sm text-hive-steel mt-1">Your office will review and place the order.</Text>
            </View>
          ) : (
            <View className="gap-3">
              <Field label="Part description" value={partName} onChangeText={setPartName} />

              <View>
                <Text className="text-xs font-bold uppercase tracking-wider text-hive-brand mb-1">
                  Part / OEM number
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={partNumber}
                    onChangeText={setPartNumber}
                    placeholder="If known"
                    placeholderTextColor={theme.colors.steel}
                    className="min-h-[48px] flex-1 rounded-sm border border-hive-border bg-hive-elevated px-3 py-2.5 text-base text-hive-mist"
                  />
                  <Pressable
                    onPress={() => void scanLabelPhoto()}
                    disabled={scanning}
                    className="min-h-[48px] min-w-[52px] items-center justify-center rounded-sm border border-hive-amber/50 bg-hive-amber/10 active:opacity-80"
                    style={{ borderRadius: theme.radius.sm }}
                    accessibilityLabel="Scan part label"
                  >
                    {scanning ? (
                      <ActivityIndicator color={theme.colors.amber} />
                    ) : (
                      <ScanLine color={theme.colors.amber} size={22} />
                    )}
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-1.5 mt-1.5">
                  <Camera color={theme.colors.steel} size={12} />
                  <Text className="text-[11px] text-hive-steel">
                    Tap scan to photograph a nameplate or part label
                  </Text>
                </View>
              </View>

              <Field
                label="Part link (optional)"
                value={partUrl}
                onChangeText={setPartUrl}
                placeholder="https://supplier.com/part…"
                keyboardType="url"
                autoCapitalize="none"
                icon={<Link2 color={theme.colors.steel} size={14} />}
              />

              <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
              <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Pentair, Carrier…" />
              <Field label="Equipment model" value={equipmentModel} onChangeText={setEquipmentModel} />
              <Field label="Notes for office" value={notes} onChangeText={setNotes} multiline />

              {error ? <Text className="text-sm text-hive-danger">{error}</Text> : null}

              <Pressable
                onPress={() => void submit()}
                disabled={submitting || scanning}
                className="min-h-[56px] items-center justify-center rounded-sm bg-hive-amber mt-2 active:opacity-80"
                style={{ borderRadius: theme.radius.sm }}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text className="font-bold text-hive-onPrimary text-base">Submit for approval</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: ReactNode;
}) {
  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-wider text-hive-brand mb-1">{label}</Text>
      <View className="relative">
        {icon ? <View className="absolute left-3 top-3.5 z-10">{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.steel}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={keyboardType === 'url' ? false : undefined}
          className={`min-h-[48px] rounded-sm border border-hive-border bg-hive-elevated py-2.5 text-base text-hive-mist ${icon ? 'pl-9 pr-3' : 'px-3'}`}
          style={multiline ? { minHeight: 72, textAlignVertical: 'top' } : undefined}
        />
      </View>
    </View>
  );
}
