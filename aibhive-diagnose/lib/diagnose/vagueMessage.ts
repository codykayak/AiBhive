/** @deprecated Import from offlineConversation.ts */
export { isVagueUserMessage, buildGreetingReply } from './offlineConversation';

export function pickVagueGenericReply(): string {
  return 'Hello! What are you working on today?';
}
