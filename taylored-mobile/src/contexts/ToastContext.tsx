import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { shadows } from '../theme/shadows';

type ToastContextValue = {
  showToast: (message: string, variant?: 'default' | 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<'default' | 'success' | 'error'>('default');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string, v: 'default' | 'success' | 'error' = 'default') => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      setVariant(v);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => setMessage(''), 2600);
    },
    [opacity]
  );

  const bg =
    variant === 'success' ? colors.successSoft : variant === 'error' ? colors.dangerSoft : colors.bgCard;
  const border =
    variant === 'success' ? colors.success : variant === 'error' ? colors.danger : colors.amber;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {!!message && (
        <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: bg, borderColor: border }]}>
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 100,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: '100%',
    ...shadows.soft,
  },
  text: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});
