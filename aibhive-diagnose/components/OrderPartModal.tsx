import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Package, X } from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import { suggestPart, submitPartRequest } from '@/lib/jobs/partRequests';
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
  onSubmitted,
}: Props) {
  const { getIdToken, profile, user } = useAuth();
  const { activePack } = usePack();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSuccess(false);
    setError(null);
    const hints = structured?.partsToCheck || [];
    const models = extractModelCandidates(userQuery);
    setPartName(hints[0] || userQuery.slice(0, 120));
    setPartNumber('');
    setQuantity('1');
    setBrand('');
    setEquipmentModel(models[0] || '');
    setNotes('');

    void (async () => {
      const token = await getIdToken();
      if (!token) return;
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
  }, [visible, userQuery, assistantReply, structured, activePack.id, getIdToken]);

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
      <View className="flex-1 bg-hive-bg px-5 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Package color={theme.colors.amber} size={22} />
            <Text className="text-lg font-bold text-hive-mist">Order part</Text>
          </View>
          <Pressable onPress={onClose} className="p-2">
            <X color={theme.colors.steel} size={22} />
          </Pressable>
        </View>

        <Text className="text-sm text-hive-steel mb-4 leading-5">
          Sends to your shop HQ for accountant approval. Job status updates to{' '}
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
            <Field label="Part / OEM number" value={partNumber} onChangeText={setPartNumber} placeholder="If known" />
            <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
            <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Pentair, Carrier…" />
            <Field label="Equipment model" value={equipmentModel} onChangeText={setEquipmentModel} />
            <Field label="Notes for office" value={notes} onChangeText={setNotes} multiline />
            {error ? <Text className="text-sm text-hive-danger">{error}</Text> : null}
            <Pressable
              onPress={() => void submit()}
              disabled={submitting}
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
      </View>
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-wider text-hive-brand mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.steel}
        multiline={multiline}
        keyboardType={keyboardType}
        className="min-h-[48px] rounded-sm border border-hive-border bg-hive-elevated px-3 py-2.5 text-base text-hive-mist"
        style={multiline ? { minHeight: 72, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
