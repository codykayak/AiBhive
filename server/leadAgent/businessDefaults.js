/** Default businesses for Lead Agent mobile app. */
export const DEFAULT_BUSINESSES = [
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
    escalationKeywords: ['appointment', 'meet', 'call me', 'talk', 'schedule', 'yes sell', 'interested'],
    escalationAction: 'notify_owner',
    escalationMessage:
      'Great — I will have our investor reach out shortly to set a time. What is the best number and time to call you back?',
    knowledge: `MacroREI (Macro Real Estate Investing) buys houses fast for cash in Eugene, Springfield, Corvallis, Roseburg, Bend, and western Oregon.
Specialties: inherited properties, probate, distressed/as-is homes, no repairs required.
This is NOT a product sales pitch. Ask if the homeowner wants to sell and book an appointment with the investor.
Investor has done 100+ deals. Commission model: appointment setting for distressed-owner lists.
Phone: (541) 321-2630. Email: cody@macrorei.com.
If they ask about probate: Oregon small estate affidavits may apply — we help families navigate options.
Always be respectful, short, and one question at a time. Honor STOP/UNSUBSCRIBE immediately.`,
  },
  {
    id: 'manydoors',
    name: 'ManyDoors AI',
    tagline: 'Property management & portfolio ops',
    brandColor: '#2563eb',
    phoneDisplay: '',
    phoneE164: '',
    website: 'https://manydoorsai.com',
    dailySmsLimit: 35,
    dailySmsSuggested: 20,
    smsProvider: 'phone',
    agentEnabled: true,
    automationEnabled: true,
    minDelayMinutes: 8,
    maxDelayMinutes: 18,
    sendWindowStart: 9,
    sendWindowEnd: 17,
    sendTimezone: 'America/Los_Angeles',
    greeting:
      'Hi, this is ManyDoors AI property management. We help owners and managers with rent roll, maintenance dispatch, and portfolio reporting. How can we help today?',
    escalationKeywords: ['demo', 'pricing', 'contract', 'onboard', 'portfolio'],
    escalationAction: 'notify_owner',
    escalationMessage: 'Thanks — I will have our team follow up with next steps. What property or unit count should we plan for?',
    knowledge: `ManyDoors AI helps property managers and owners with rent-roll import, nightly portfolio sync, maintenance workflows, and AI-assisted ops.
Tone: professional, concise, helpful. Not aggressive sales.`,
  },
  {
    id: 'aibhive-pros',
    name: 'AiBhive Pros',
    tagline: 'Field service intelligence — HVAC, plumbing, electrical',
    brandColor: '#F5A623',
    phoneDisplay: '(217) 600-2129',
    phoneE164: '+12176002129',
    website: 'https://aibhive.com/pros',
    dailySmsLimit: 50,
    dailySmsSuggested: 30,
    smsProvider: 'phone',
    agentEnabled: true,
    automationEnabled: true,
    minDelayMinutes: 5,
    maxDelayMinutes: 12,
    sendWindowStart: 8,
    sendWindowEnd: 19,
    sendTimezone: 'America/Los_Angeles',
    greeting:
      'Hi, this is AiBhive Pros — we help trade shops with dispatch, Diagnose app, and field playbooks. What trade are you in and what can we help with?',
    escalationKeywords: ['demo', 'signup', 'trial', 'dispatch', 'appointment'],
    escalationAction: 'notify_owner',
    escalationMessage: 'Got it — someone from our team will reach out. Best email or callback number?',
    knowledge: `AiBhive Pros is field intelligence for HVAC, plumbing, electrical, pool, and property maintenance teams.
Diagnose app: aibhive.com/diagnose. Pros HQ: aibhive.com/pros/app.
Voice line: (217) 600-2129. Short sentences, trade playbooks, escalate gas/CO/fire/flood immediately.`,
  },
];

export function getDefaultBusiness(id) {
  return DEFAULT_BUSINESSES.find((b) => b.id === id) || null;
}
