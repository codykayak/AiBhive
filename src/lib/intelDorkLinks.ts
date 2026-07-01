export type DorkLink = { label: string; url: string; query?: string };

/** Parse google_dorks tool output into clickable links. */
export function parseDorkLinks(data?: string): DorkLink[] {
  if (!data) return [];
  const links: DorkLink[] = [];
  const blocks = data.split(/\n\n+/);
  for (const block of blocks) {
    const labelMatch = block.match(/^\d+\.\s*(.+)/m);
    const queryMatch = block.match(/Query:\s*(.+)/);
    const urlMatch = block.match(/Open(?: in browser)?:\s*(https:\/\/[^\s]+)/);
    if (urlMatch) {
      links.push({
        label: labelMatch?.[1]?.split('\n')[0]?.trim() ?? 'Dork query',
        query: queryMatch?.[1]?.trim(),
        url: urlMatch[1],
      });
    }
  }
  return links;
}
