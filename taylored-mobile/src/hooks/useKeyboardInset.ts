import { useEffect, useState } from 'react';
import { Keyboard, Platform, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../components/ResponsiveShell';
import { useDexLayout } from './useDexLayout';

/** Extra bottom inset when keyboard is open — fixes DeX / tablet input hidden behind keyboard. */
export function useKeyboardInset(basePadding = 0) {
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => setKeyboardHeight(0);

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const bottomPad =
    keyboardHeight > 0
      ? Math.max(8, keyboardHeight - insets.bottom + (isWide ? 12 : 0))
      : basePadding;

  return { keyboardHeight, bottomPad, isWide };
}

export function keyboardAvoidBehavior(): 'padding' | 'height' | undefined {
  if (Platform.OS === 'ios') return 'padding';
  return 'padding';
}

export function keyboardVerticalOffset(isWide: boolean): number {
  if (Platform.OS === 'ios') return 88;
  return isWide ? 32 : 0;
}

export function dexInputBarStyle(keyboardOpen: boolean): ViewStyle {
  return {
    backgroundColor: keyboardOpen ? '#0f172a' : 'transparent',
    borderTopWidth: keyboardOpen ? 1 : 0,
    borderTopColor: 'rgba(245, 158, 11, 0.25)',
    paddingTop: keyboardOpen ? 8 : 0,
  };
}
