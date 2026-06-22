import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SIDE_RAIL_WIDTH = 76;

/**
 * Samsung DeX / tablet / landscape desktop detection.
 * DeX often reports wide dimensions but may still use phone density.
 */
export function useDexLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isLandscape = width > height;
  const isWide = width >= 600;
  const isDex = isWide || (isLandscape && longSide >= 640);
  const isDesktop = width >= 900 || (isLandscape && width >= 720);
  /** Side nav frees vertical space on DeX landscape monitors. */
  const useSideNav = isDesktop && isLandscape;
  const contentPadding = isDesktop ? 28 : isDex ? 20 : 16;
  const typeScale = isDesktop ? 1.08 : isDex ? 1.04 : 1;

  return {
    width,
    height,
    shortSide,
    longSide,
    fontScale,
    insets,
    isLandscape,
    isWide,
    isDex,
    isDesktop,
    useSideNav,
    sideRailWidth: SIDE_RAIL_WIDTH,
    contentPadding,
    typeScale,
    /** Use full monitor width on DeX — avoid a skinny phone column. */
    contentMaxWidth: isDesktop ? width : isWide ? Math.min(width, 960) : width,
  };
}
