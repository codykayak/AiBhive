export function money(n: number | null | undefined, mode: 'auto' | 'full' = 'auto'): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (mode === 'auto') {
    if (a >= 1_000_000_000) return `${sign}$${(a / 1_000_000_000).toFixed(2)}B`;
    if (a >= 100_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`;
    if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(2)}M`;
    if (a >= 100_000) return `${sign}$${Math.round(a / 1000)}k`;
  }
  return (
    sign +
    a.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: a >= 1000 ? 0 : 2,
    })
  );
}

export function psf(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  return `${n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits })}/SF`;
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export function multiple(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}x`;
}

export function num(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}
