/** Light field-app palette — aligned with AiBhive Pros marketing (slate + amber + brand blue/teal). */
export const theme = {
  colors: {
    bg: '#FFFFFF',
    elevated: '#F8FAFC',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    ink: '#0F172A',
    muted: '#64748B',
    amber: '#F5A623',
    orange: '#F5A623',
    navy: '#1E3A8A',
    /** @deprecated use navy — kept for gradual migration */
    brand: '#1E3A8A',
    teal: '#0891B2',
    amberDim: '#D4880C',
    /** @deprecated use ink — kept for gradual migration */
    mist: '#0F172A',
    /** @deprecated use muted */
    steel: '#64748B',
    onOrange: '#FFFFFF',
    /** @deprecated use onOrange */
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    pool: '#0891B2',
    electrical: '#F5A623',
    plumbing: '#2563EB',
    hvac: '#1E3A8A',
    property: '#7C9A6E',
    fiber: '#8B5CF6',
  },
  touch: {
    minHeight: 56,
    iconSize: 28,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 10,
  },
} as const;

export type ThemeColors = typeof theme.colors;
