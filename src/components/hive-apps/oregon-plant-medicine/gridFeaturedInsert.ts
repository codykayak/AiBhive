import type { ReactNode } from 'react';

/** Insert a featured tile after N items (default 1 = after 2 tiles, start of row 2 in a 3-col grid). */
export function interleaveFeaturedTile(
  items: ReactNode[],
  featured: ReactNode | null | undefined,
  afterIndex = 1,
): ReactNode[] {
  if (!featured) return items;
  const out: ReactNode[] = [];
  let inserted = false;
  items.forEach((node, i) => {
    out.push(node);
    if (i === afterIndex) {
      out.push(featured);
      inserted = true;
    }
  });
  if (!inserted) out.push(featured);
  return out;
}
