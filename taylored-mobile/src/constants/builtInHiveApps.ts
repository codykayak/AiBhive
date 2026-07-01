import { FolderKanban, Bot, Radar, GraduationCap, type LucideIcon } from 'lucide-react-native';

export type BuiltInHiveApp = {
  id: string;
  title: string;
  creator: string;
  tagline: string;
  desc: string;
  route: 'JobTracker' | 'AutoBotResume' | 'IntelAgent' | 'HomeworkBot';
  icon: LucideIcon;
  themeKey: 'tracker' | 'resume' | 'research' | 'homework';
  primary: string;
  primarySoft: string;
  surface: string;
  bg: string;
  accentText: string;
};

/** Pre-installed community-style apps — distinct look, not AiBhive-branded inside. */
export const BUILT_IN_HIVE_APPS: BuiltInHiveApp[] = [
  {
    id: 'builtin-job-tracker',
    title: 'Job Tracker',
    creator: 'maya.j',
    tagline: 'Applications & follow-ups',
    desc: 'Pipeline for every application — status, materials, and follow-ups.',
    route: 'JobTracker',
    icon: FolderKanban,
    themeKey: 'tracker',
    primary: '#3b82f6',
    primarySoft: 'rgba(59,130,246,0.16)',
    surface: '#131c2e',
    bg: '#0b1220',
    accentText: '#93c5fd',
  },
  {
    id: 'builtin-resume-bot',
    title: 'Auto-Bot Resume',
    creator: 'alex.r',
    tagline: 'Tailored application kits',
    desc: 'Tailored resume, cover letter, and cold email in one tap.',
    route: 'AutoBotResume',
    icon: Bot,
    themeKey: 'resume',
    primary: '#f43f5e',
    primarySoft: 'rgba(244,63,94,0.16)',
    surface: '#1a1014',
    bg: '#120a0d',
    accentText: '#fda4af',
  },
  {
    id: 'builtin-research',
    title: 'Research',
    creator: 'jordan.k',
    tagline: 'Intel workspace',
    desc: 'AI-directed intel on companies, websites, and people.',
    route: 'IntelAgent',
    icon: Radar,
    themeKey: 'research',
    primary: '#8b5cf6',
    primarySoft: 'rgba(139,92,246,0.18)',
    surface: '#161024',
    bg: '#0d0818',
    accentText: '#c4b5fd',
  },
  {
    id: 'builtin-homework-bot',
    title: 'Homework Bot',
    creator: 'aibhive',
    tagline: 'OCR → private RAG → Grok',
    desc: 'Upload reference pages, build a private library, and complete assignments grounded in your material.',
    route: 'HomeworkBot',
    icon: GraduationCap,
    themeKey: 'homework',
    primary: '#f59e0b',
    primarySoft: 'rgba(245,158,11,0.16)',
    surface: '#1a1408',
    bg: '#100c04',
    accentText: '#fcd34d',
  },
];

export function builtInAppForRoute(route: string): BuiltInHiveApp | undefined {
  return BUILT_IN_HIVE_APPS.find((a) => a.route === route);
}

export function builtInAppForThemeKey(key: string): BuiltInHiveApp | undefined {
  return BUILT_IN_HIVE_APPS.find((a) => a.themeKey === key);
}
