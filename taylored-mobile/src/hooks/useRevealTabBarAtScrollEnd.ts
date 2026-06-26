import { useCallback, useRef } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTabBarControl } from '../context/TabBarControlContext';

const BOTTOM_THRESHOLD = 48;

/** Hide the bottom tab bar until the user scrolls to the end of the content. */
export function useRevealTabBarAtScrollEnd() {
  const tabBar = useTabBarControl();
  const atBottomRef = useRef(false);
  const metricsRef = useRef({ contentH: 0, layoutH: 0, offsetY: 0 });

  const evaluate = useCallback(() => {
    const tabBarControl = tabBar;
    if (!tabBarControl) return;

    const { contentH, layoutH, offsetY } = metricsRef.current;
    if (layoutH <= 0) return;

    const fitsOnScreen = contentH <= layoutH + 4;
    const atBottom =
      fitsOnScreen || offsetY + layoutH >= contentH - BOTTOM_THRESHOLD;

    if (atBottom !== atBottomRef.current) {
      atBottomRef.current = atBottom;
      tabBarControl.setTabBarHidden(!atBottom);
    }
  }, [tabBar]);

  useFocusEffect(
    useCallback(() => {
      tabBar?.setTabBarHidden(true);
      atBottomRef.current = false;
      return () => tabBar?.setTabBarHidden(false);
    }, [tabBar])
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      metricsRef.current = {
        contentH: contentSize.height,
        layoutH: layoutMeasurement.height,
        offsetY: contentOffset.y,
      };
      evaluate();
    },
    [evaluate]
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      metricsRef.current.contentH = height;
      evaluate();
    },
    [evaluate]
  );

  const onScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      metricsRef.current.layoutH = event.nativeEvent.layout.height;
      evaluate();
    },
    [evaluate]
  );

  return { onScroll, onContentSizeChange, onScrollLayout };
}
