import React, { type RefObject } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Send, Mic, ImagePlus, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

type Attachment = { uri: string };

type Props = {
  inputRef?: RefObject<TextInput | null>;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onSubmit: () => void;
  placeholder?: string;
  loading?: boolean;
  pendingAttachment?: Attachment | null;
  onClearAttachment?: () => void;
  onPickImage?: () => void;
  onMicPress?: () => void;
  listening?: boolean;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
};

export function ChatComposerBox({
  inputRef,
  value,
  onChangeText,
  onFocus,
  onSubmit,
  placeholder = 'Ask anything…',
  loading = false,
  pendingAttachment,
  onClearAttachment,
  onPickImage,
  onMicPress,
  listening = false,
  style,
  minHeight = 140,
}: Props) {
  const canSend = Boolean(value.trim() || pendingAttachment);

  return (
    <View style={[styles.box, { minHeight }, style]}>
      {pendingAttachment ? (
        <View style={styles.attachRow}>
          <Image source={{ uri: pendingAttachment.uri }} style={styles.attachThumb} />
          <TouchableOpacity onPress={onClearAttachment} hitSlop={12}>
            <X color={colors.textDim} size={18} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        scrollEnabled
        maxLength={2000}
        onFocus={onFocus}
        editable={!loading}
      />

      <View style={styles.toolbar}>
        {onPickImage ? (
          <TouchableOpacity style={styles.toolBtn} onPress={onPickImage} disabled={loading} hitSlop={8}>
            <ImagePlus color={pendingAttachment ? colors.amber : colors.textMuted} size={22} />
          </TouchableOpacity>
        ) : null}
        {onMicPress ? (
          <TouchableOpacity
            style={[styles.toolBtn, listening && styles.toolBtnActive]}
            onPress={onMicPress}
            hitSlop={8}
          >
            <Mic color={listening ? colors.bg : colors.textMuted} size={22} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.toolbarSpacer} />
        <TouchableOpacity
          style={[styles.toolBtn, styles.sendBtn, !canSend && styles.sendDisabled]}
          onPress={onSubmit}
          disabled={!canSend || loading}
          hitSlop={8}
        >
          <Send color={canSend ? colors.bg : colors.textDim} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TOOLBAR_H = 44;

const styles = StyleSheet.create({
  box: {
    width: '100%',
    backgroundColor: '#000000',
    flex: 1,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  attachThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: colors.bgCard,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: TOOLBAR_H + 6,
    backgroundColor: '#000000',
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TOOLBAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#000000',
  },
  toolbarSpacer: { flex: 1 },
  toolBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: colors.amber,
    borderRadius: 20,
  },
  sendBtn: {
    backgroundColor: colors.amber,
    borderRadius: 20,
  },
  sendDisabled: { opacity: 0.35 },
});
