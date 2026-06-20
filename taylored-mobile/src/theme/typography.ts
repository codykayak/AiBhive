export const typography = {
  hero: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '800' as const },
  h3: { fontSize: 17, fontWeight: '800' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  overline: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  mono: { fontSize: 13, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
} as const;
