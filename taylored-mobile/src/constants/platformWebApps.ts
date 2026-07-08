import { Languages, Mic, ScanText, Wand2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type PlatformWebApp = {
  id: string;
  title: string;
  summary: string;
  url: string;
  icon: LucideIcon;
};

/** AiBhive web tools — open in-app WebView from the mobile Apps tab. */
export const PLATFORM_WEB_APPS: PlatformWebApp[] = [
  {
    id: 'platform/ocr-lab',
    title: 'OCR Lab',
    summary: 'Extract text from photos and scans.',
    url: 'https://aibhive.com/ocr-lab',
    icon: ScanText,
  },
  {
    id: 'platform/translation-lab',
    title: 'Translation Lab',
    summary: 'Transcribe and translate in 20+ languages.',
    url: 'https://aibhive.com/get-started',
    icon: Languages,
  },
  {
    id: 'platform/transcription-studio',
    title: 'Transcription Studio',
    summary: 'Record, transcribe, and polish audio.',
    url: 'https://aibhive.com/transcription',
    icon: Mic,
  },
  {
    id: 'platform/tools-hub',
    title: 'Tools Hub',
    summary: 'Browse all AiBhive web tools.',
    url: 'https://aibhive.com/tools',
    icon: Wand2,
  },
];
