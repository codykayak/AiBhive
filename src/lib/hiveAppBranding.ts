import {
  Sparkles, Rocket, Target, Flame, Leaf, Heart,
  Star, Zap, ListChecks, Calculator, Pencil, BookOpen,
  Wallet, Dumbbell, Coffee, Sun, Moon, Compass,
  type LucideIcon,
} from 'lucide-react';
import type { HiveAppIcon, HiveAppTheme } from './hiveAppTypes';

export type HiveBrand = {
  primary: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  contrastText: string;
};

const THEME_LOOKUP: Record<HiveAppTheme, HiveBrand> = {
  amber: {
    primary: '#f59e0b',
    primarySoft: 'rgba(245,158,11,0.18)',
    primaryText: '#fcd34d',
    accent: '#fbbf24',
    gradientFrom: '#f59e0b',
    gradientTo: '#b45309',
    contrastText: '#0b0f14',
  },
  blue: {
    primary: '#3b82f6',
    primarySoft: 'rgba(59,130,246,0.18)',
    primaryText: '#93c5fd',
    accent: '#60a5fa',
    gradientFrom: '#2563eb',
    gradientTo: '#1e3a8a',
    contrastText: '#0b1220',
  },
  green: {
    primary: '#10b981',
    primarySoft: 'rgba(16,185,129,0.18)',
    primaryText: '#6ee7b7',
    accent: '#34d399',
    gradientFrom: '#059669',
    gradientTo: '#064e3b',
    contrastText: '#022c22',
  },
  purple: {
    primary: '#a855f7',
    primarySoft: 'rgba(168,85,247,0.18)',
    primaryText: '#d8b4fe',
    accent: '#c084fc',
    gradientFrom: '#9333ea',
    gradientTo: '#581c87',
    contrastText: '#1a0f2e',
  },
  pink: {
    primary: '#ec4899',
    primarySoft: 'rgba(236,72,153,0.18)',
    primaryText: '#f9a8d4',
    accent: '#f472b6',
    gradientFrom: '#db2777',
    gradientTo: '#831843',
    contrastText: '#2a0a17',
  },
  slate: {
    primary: '#64748b',
    primarySoft: 'rgba(100,116,139,0.22)',
    primaryText: '#cbd5e1',
    accent: '#94a3b8',
    gradientFrom: '#475569',
    gradientTo: '#1e293b',
    contrastText: '#f1f5f9',
  },
};

const ICON_LOOKUP: Record<HiveAppIcon, LucideIcon> = {
  sparkles: Sparkles,
  rocket: Rocket,
  target: Target,
  flame: Flame,
  leaf: Leaf,
  heart: Heart,
  star: Star,
  zap: Zap,
  list: ListChecks,
  calculator: Calculator,
  pencil: Pencil,
  book: BookOpen,
  wallet: Wallet,
  dumbbell: Dumbbell,
  coffee: Coffee,
  sun: Sun,
  moon: Moon,
  compass: Compass,
};

export function brandFor(theme: HiveAppTheme | string | undefined): HiveBrand {
  return THEME_LOOKUP[theme as HiveAppTheme] || THEME_LOOKUP.amber;
}

export function iconFor(icon: HiveAppIcon | string | undefined): LucideIcon {
  return ICON_LOOKUP[icon as HiveAppIcon] || Sparkles;
}

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All apps',
  trackers: 'Trackers',
  calculators: 'Calculators',
  lists: 'Lists',
  notes: 'Notes',
  guides: 'Guides',
  other: 'Other',
};
