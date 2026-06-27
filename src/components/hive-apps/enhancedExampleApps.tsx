import type { ComponentType } from 'react';
import ResumeBotWebApp from './ResumeBotWebApp';
import ResearchWebApp from './ResearchWebApp';

/** Example apps that use a full interactive host instead of generic spec pages. */
export const ENHANCED_EXAMPLE_APPS: Record<string, ComponentType<{ expanded?: boolean }>> = {
  'example-resume-bot': ResumeBotWebApp,
  'example-research': ResearchWebApp,
};

export function getEnhancedExampleApp(appId: string) {
  return ENHANCED_EXAMPLE_APPS[appId] ?? null;
}
