export const theme = {
  colors: {
    bg: '#0B0F14',
    elevated: '#121820',
    card: '#1A222D',
    border: '#2A3544',
    amber: '#F5A623',
    amberDim: '#C4841A',
    steel: '#8B9BB0',
    mist: '#E8EEF5',
    danger: '#E85D4C',
    success: '#3DCF8E',
    pool: '#2BB8C8',
    electrical: '#F0B429',
    plumbing: '#4A9FD4',
    hvac: '#7B9FD4',
  },
  touch: {
    minHeight: 56,
    iconSize: 28,
  },
} as const;

export type ThemeColors = typeof theme.colors;
