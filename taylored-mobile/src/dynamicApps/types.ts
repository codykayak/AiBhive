/**
 * Types for HiveAppSpec — the schema the server emits and the mobile app
 * renders dynamically. Mirror of server/hiveAppsApi.js shape.
 */

export type HiveAppTheme = 'amber' | 'blue' | 'green' | 'purple' | 'pink' | 'slate';

export type HiveAppIcon =
  | 'sparkles' | 'rocket' | 'target' | 'flame' | 'leaf' | 'heart'
  | 'star' | 'zap' | 'list' | 'calculator' | 'pencil' | 'book'
  | 'wallet' | 'dumbbell' | 'coffee' | 'sun' | 'moon' | 'compass';

export type HiveAppPageType = 'list' | 'tracker' | 'note' | 'calculator' | 'info';

export interface ListConfig {
  addPlaceholder: string;
  emptyMessage: string;
  seed: string[];
  showCheckbox: boolean;
}

export interface TrackerConfig {
  unit: string;
  prompt: string;
  defaultValue: number;
  aggregate: 'sum' | 'avg' | 'count' | 'latest';
  timeframeDays: number;
}

export interface NoteConfig {
  placeholder: string;
  seedText: string;
}

export interface CalculatorInput {
  id: string;
  label: string;
  unit?: string;
  defaultValue?: number;
}

export interface CalculatorConfig {
  inputs: CalculatorInput[];
  formula: string;
  resultLabel: string;
  resultUnit?: string;
}

export interface InfoConfig {
  body?: string;
  bullets?: string[];
  links?: { label: string; url: string }[];
}

export interface HiveAppPage {
  id: string;
  title: string;
  type: HiveAppPageType;
  config: ListConfig | TrackerConfig | NoteConfig | CalculatorConfig | InfoConfig;
}

export interface HiveAppSpec {
  id: string;
  slug: string;
  ownerId: string;
  title: string;
  tagline?: string;
  summary?: string;
  theme: HiveAppTheme;
  icon: HiveAppIcon;
  storage: 'local' | 'cloud';
  pages: HiveAppPage[];
  sourceTaskId?: string | null;
  sourceCommunityAppId?: string | null;
  visibility?: 'private' | 'community';
  toolkitKeywords?: string[];
  installCount?: number;
  sharedAt?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CommunityToolkitApp = Pick<
  HiveAppSpec,
  'id' | 'title' | 'tagline' | 'summary' | 'theme' | 'icon' | 'pages' | 'installCount' | 'sharedAt'
>;
