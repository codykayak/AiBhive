import { theme } from '@/constants/theme';

export function buildTabBarStyle(bottomInset: number) {
  const bottom = Math.max(bottomInset, 8);
  return {
    backgroundColor: theme.colors.elevated,
    borderTopColor: theme.colors.border,
    height: 56 + bottom,
    paddingTop: 6,
    paddingBottom: bottom,
    display: 'flex' as const,
  };
}
