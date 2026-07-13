/** Combine optional HTML date + time inputs into a display string for `scheduledFor`. */
export function formatScheduledFor(date: string, time: string): string | null {
  const d = date.trim();
  if (!d) return null;

  const t = time.trim();
  if (t) {
    const dt = new Date(`${d}T${t}`);
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }
    return `${d} ${t}`;
  }

  const dateOnly = new Date(`${d}T12:00`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }
  return d;
}
