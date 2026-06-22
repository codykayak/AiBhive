/**
 * Registry of Hive-built apps that ship INSIDE AiBhive.
 *
 * When a `host_screen` build completes, the Cursor agent appends an entry here
 * pointing to a new folder under `taylored-mobile/src/userApps/<slug>/`. The
 * registry is read by:
 *   - `AppNavigator.tsx` to mount each entry as a stack screen named `UserApp:<slug>`.
 *   - `AppsScreen.tsx` to render launcher cards.
 *   - `HiveAppDetailScreen.tsx` to provide a one-tap "Open in AiBhive" button
 *     and route based on the build's `target` and `slug`.
 *
 * The registry is intentionally a plain array so build agents can append to it
 * with a minimal, conflict-free diff (no JSON parsing required).
 */

import type { ComponentType } from 'react';

export type UserAppAccent = 'amber' | 'info' | 'purple' | 'success';

export type UserAppEntry = {
  slug: string;
  title: string;
  description: string;
  icon?: string;
  accent?: UserAppAccent;
  taskId?: string;
  /** React component (may be lazy via require) for the screen. */
  component: ComponentType<any>;
};

import HiveAppPlaceholderScreen from './HiveAppPlaceholderScreen';
import HouseFlippingCalculator from './house-flipping-calculator';

export const HIVE_USER_APPS: UserAppEntry[] = [
  // Build agents append entries here after generating
  // `taylored-mobile/src/userApps/<slug>/index.tsx`. Example:
  //
  //   import HabitTracker from './habit-tracker';
  //   HIVE_USER_APPS.push({
  //     slug: 'habit-tracker',
  //     title: 'Habit Tracker',
  //     description: 'Daily streaks built for you.',
  //     accent: 'amber',
  //     component: HabitTracker,
  //   });
];

HIVE_USER_APPS.push({
  slug: 'house-flipping-calculator',
  title: 'House Flipping Cost Calculator',
  description: 'Estimate Oregon flip costs, profit, and ROI.',
  icon: 'calculator',
  accent: 'amber',
  taskId: 'hive_1782158179170_k2wfxm',
  component: HouseFlippingCalculator,
});

export function findUserApp(slug?: string | null): UserAppEntry | null {
  if (!slug) return null;
  return HIVE_USER_APPS.find((a) => a.slug === slug) || null;
}

export function userAppRouteName(slug: string): string {
  return `UserApp:${slug}`;
}

export { HiveAppPlaceholderScreen };
