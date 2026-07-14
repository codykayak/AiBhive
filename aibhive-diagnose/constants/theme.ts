/** Light field-app palette — aligned with AiBhive Pros marketing (slate + amber + brand blue/teal). */
export const theme = {
  colors: {
    bg: '#FAFBFC',
    elevated: '#FFFFFF',
    card: '#F1F5F9',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    amber: '#F5A623',
    amberDim: '#C4841A',
    brand: '#1E3A8A',
    teal: '#2BB8C8',
    steel: '#64748B',
    mist: '#0F172A',
    onPrimary: '#0F172A',
    danger: '#DC2626',
    success: '#16A34A',
    pool: '#2BB8C8',
    electrical: '#F0B429',
    plumbing: '#4A9FD4',
    hvac: '#7B9FD4',
    property: '#7C9A6E',
    fiber: '#8B5CF6',
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  touch: {
    minHeight: 56,
    iconSize: 28,
  },
} as const;

export type ThemeColors = typeof theme.colors;
