import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { loadProactivePrefs } from './proactivePrefs';

export type FollowUpPreset = 3 | 7 | 14;

export async function ensureCalendarPermission(): Promise<boolean> {
  const prefs = await loadProactivePrefs();
  if (!prefs.calendarReminders) return false;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

async function pickWritableCalendar(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.allowsModifications);
  return writable?.id ?? calendars[0]?.id ?? null;
}

export async function addJobFollowUpEvent(opts: {
  companyName: string;
  roleTitle?: string;
  daysFromNow: FollowUpPreset | number;
}): Promise<{ ok: true; eventId: string } | { ok: false; error: string }> {
  const allowed = await ensureCalendarPermission();
  if (!allowed) {
    return { ok: false, error: 'Calendar permission was not granted.' };
  }

  const calendarId = await pickWritableCalendar();
  if (!calendarId) {
    return { ok: false, error: 'No writable calendar found on this device.' };
  }

  const start = new Date();
  start.setDate(start.getDate() + opts.daysFromNow);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const title = `Follow up: ${opts.companyName}${opts.roleTitle ? ` — ${opts.roleTitle}` : ''}`;
  const notes = 'Added by AiBhive Job Tracker. Check your application status and send a polite follow-up.';

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      notes,
      startDate: start,
      endDate: end,
      timeZone: Platform.OS === 'android' ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -15 }],
    });
    return { ok: true, eventId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not create calendar event.' };
  }
}

export function formatFollowUpDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
