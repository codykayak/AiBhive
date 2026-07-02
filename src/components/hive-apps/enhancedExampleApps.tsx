import type { ComponentType } from 'react';
import ResumeBotWebApp from './ResumeBotWebApp';
import ResearchWebApp from './ResearchWebApp';
import JobHunterWebApp from './JobHunterWebApp';
import SocialPostHunterWebApp from './SocialPostHunterWebApp';
import MockRealEstateCommandCenter from './MockRealEstateCommandCenter';
import HomeworkBotWebApp from './HomeworkBotWebApp';
import MeetingBurnWebApp from './MeetingBurnWebApp';
import FocusReactorWebApp from './FocusReactorWebApp';

/** Example apps that use a full interactive host instead of generic spec pages. */
export const ENHANCED_EXAMPLE_APPS: Record<string, ComponentType<{ expanded?: boolean }>> = {
  'example-job-hunter': JobHunterWebApp,
  'example-social-post-hunter': SocialPostHunterWebApp,
  'example-resume-bot': ResumeBotWebApp,
  'example-research': ResearchWebApp,
  'example-mock-realestate': MockRealEstateCommandCenter,
  'example-homework-bot': HomeworkBotWebApp,
  'example-meeting-burn': MeetingBurnWebApp,
  'example-focus-reactor': FocusReactorWebApp,
};

export function getEnhancedExampleApp(appId: string) {
  return ENHANCED_EXAMPLE_APPS[appId] ?? null;
}
