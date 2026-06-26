import React, { useEffect, useRef, type RefObject } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Send, Mic, ImagePlus, X, Sparkles, Hammer } from 'lucide-react-native';
import { colors, radii } from '../theme/colors';

type Attachment = { uri: string };

export type ComposerMode = 'plan' | 'build';

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
  /** Optional Plan/Build mode toggle. When provided, renders the segmented control in the toolbar. */
  mode?: ComposerMode;
  onModeChange?: (mode: ComposerMode) => void;
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
  mode,
  onModeChange,
}: Props) {
  const canSend = Boolean(value.trim() || pendingAttachment) && !loading;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const pulseStyle = {
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }),
      },
    ],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
  };

  const showModeToggle = mode !== undefined && !!onModeChange;

  return (
    <View style={[styles.box, { minHeight }, style]}>
      {pendingAttachment ? (
        <View style={styles.attachRow}>
          <Image source={{ uri: pendingAttachment.uri }} style={styles.attachThumb} />
          <Text style={styles.attachLabel} numberOfLines={1}>
            Image attached
          </Text>
          <TouchableOpacity onPress={onClearAttachment} hitSlop={12} style={styles.attachClear}>
            <X color={colors.textDim} size={16} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputWrap}>
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
          underlineColorAndroid="transparent"
          selectionColor={colors.amber}
        />
      </View>

      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          {onPickImage ? (
            <TouchableOpacity
              style={[styles.toolBtn, pendingAttachment && styles.toolBtnActiveSoft]}
              onPress={onPickImage}
              disabled={loading}
              hitSlop={8}
              accessibilityLabel="Attach image"
            >
              <ImagePlus
                color={pendingAttachment ? colors.amber : colors.textMuted}
                size={20}
              />
            </TouchableOpacity>
          ) : null}
          {onMicPress ? (
            <TouchableOpacity
              style={[styles.toolBtn, listening && styles.toolBtnListening]}
              onPress={onMicPress}
              hitSlop={8}
              accessibilityLabel={listening ? 'Stop voice input' : 'Start voice input'}
            >
              {listening ? (
                <Animated.View style={[styles.micPulse, pulseStyle]} pointerEvents="none" />
              ) : null}
              <Mic color={listening ? colors.bg : colors.textMuted} size={20} />
            </TouchableOpacity>
          ) : null}
        </View>

        {showModeToggle ? (
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'plan' && styles.modeChipActive]}
              onPress={() => onModeChange!('plan')}
              disabled={loading}
              accessibilityLabel="Plan mode — discuss the app before building"
              hitSlop={4}
            >
              <Sparkles
                size={13}
                color={mode === 'plan' ? colors.bg : colors.textMuted}
              />
              <Text
                style={[styles.modeChipText, mode === 'plan' && styles.modeChipTextActive]}
              >
                Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'build' && styles.modeChipActive]}
              onPress={() => onModeChange!('build')}
              disabled={loading}
              accessibilityLabel="Build mode — let AiBhive create the app for you"
              hitSlop={4}
            >
              <Hammer
                size={13}
                color={mode === 'build' ? colors.bg : colors.textMuted}
              />
              <Text
                style={[styles.modeChipText, mode === 'build' && styles.modeChipTextActive]}
              >
                Build
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.toolbarSpacer} />
        )}

        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendDisabled]}
          onPress={onSubmit}
          disabled={!canSend}
          hitSlop={8}
          accessibilityLabel="Send message"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Send color={canSend ? colors.bg : colors.textDim} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.18)',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  attachThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.bgCard,
  },
  attachLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  attachClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  inputWrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.08)',
    backgroundColor: colors.black,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarSpacer: { flex: 1 },
  toolBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  toolBtnActiveSoft: {
    backgroundColor: colors.amberSoft,
  },
  toolBtnListening: {
    backgroundColor: colors.amber,
  },
  micPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    marginHorizontal: 6,
    maxWidth: 220,
    alignSelf: 'center',
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  modeChipActive: {
    backgroundColor: colors.amber,
  },
  modeChipText: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  modeChipTextActive: {
    color: colors.bg,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
});
