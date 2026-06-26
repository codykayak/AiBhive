import { useCallback, useRef } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTabBarControl } from '../context/TabBarControlContext';

/** How close to the bottom (px) before the tab bar fades in */
const BOTTOM_THRESHOLD = 80;

/** Extra space below the floating chat dock */
export const DOCK_BOTTOM_BUFFER = 10;

/** Hide the bottom tab bar until the user scrolls to the end of the content. */
export function useRevealTabBarAtScrollEnd() {
  const tabBar = useTabBarControl();
  const atBottomRef = useRef(false);
  const metricsRef = useRef({ contentH: 0, layoutH: 0, offsetY: 0 });

  const evaluate = useCallback(() => {
    const tabBarControl = tabBar;
    if (!tabBarControl) return;

    const { contentH, layoutH, offsetY } = metricsRef.current;
    if (layoutH <= 0 || contentH <= 0) return;

    const maxScroll = Math.max(contentH - layoutH, 0);
    const atBottom = maxScroll <= BOTTOM_THRESHOLD || offsetY >= maxScroll - BOTTOM_THRESHOLD;

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

  const ingestScroll = useCallback(
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

  return {
    onScroll: ingestScroll,
    onMomentumScrollEnd: ingestScroll,
    onScrollEndDrag: ingestScroll,
    onContentSizeChange,
    onScrollLayout,
  };
}
