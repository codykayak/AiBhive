import type { Business } from './types';

/** MacroREI-only defaults for Lead Agent (Eugene investor SMS). */
export const DEFAULT_BUSINESSES: Business[] = [
  {
    id: 'macrorei',
    name: 'MacroREI',
    tagline: 'Cash home buying — Eugene & western Oregon',
    brandColor: '#1e4d2b',
    phoneDisplay: '(541) 321-2630',
    phoneE164: '+15413212630',
    website: 'https://macrorei.com',
    dailySmsLimit: 40,
    dailySmsSuggested: 25,
    smsProvider: 'phone',
    agentEnabled: true,
    automationEnabled: true,
    minDelayMinutes: 6,
    maxDelayMinutes: 15,
    sendWindowStart: 9,
    sendWindowEnd: 18,
    sendTimezone: 'America/Los_Angeles',
    outboundTemplate:
      "my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?",
    greeting:
      "Hi, my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?",
    escalationKeywords: ['appointment', 'meet', 'call me', 'talk', 'schedule', 'yes sell', 'interested', 'selling'],
    escalationMessage:
      'Great — I will have our investor reach out shortly to set a time. What is the best number and time to call you back?',
    knowledge: `MacroREI (Macro Real Estate Investing) buys houses fast for cash in Eugene, Springfield, Corvallis, Roseburg, Bend, and western Oregon.
Specialties: inherited properties, probate, distressed/as-is homes, no repairs required.
This is NOT a product sales pitch. Ask if the homeowner wants to sell and book an appointment with the investor.
Investor has done 100+ deals. Phone: (541) 321-2630. Email: cody@macrorei.com.
Always be respectful, short, and one question at a time. Honor STOP/UNSUBSCRIBE immediately.`,
  },
];
