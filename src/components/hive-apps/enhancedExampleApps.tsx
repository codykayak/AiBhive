import type { ComponentType } from 'react';
import AutoSocialWebApp from './AutoSocialWebApp';
import IntelGatheringWebApp from './IntelGatheringWebApp';
import IntelResearchWebApp from './IntelResearchWebApp';
import JobTrackerWebApp from './JobTrackerWebApp';
import ResumeBotWebApp from './ResumeBotWebApp';

/** Example apps that use a full interactive host instead of generic spec pages. */
export const ENHANCED_EXAMPLE_APPS: Record<string, ComponentType<{ expanded?: boolean }>> = {
  'example-job-tracker': JobTrackerWebApp,
  'example-resume-bot': ResumeBotWebApp,
  'example-research': IntelResearchWebApp,
  'example-intel-gathering': IntelGatheringWebApp,
  'example-auto-social': AutoSocialWebApp,
};

export function getEnhancedExampleApp(appId: string) {
  return ENHANCED_EXAMPLE_APPS[appId] ?? null;
}
