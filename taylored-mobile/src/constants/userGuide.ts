/** User Guide copy — how Hive builds become usable apps. */

export type GuideSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
};

export const USER_GUIDE_INTRO =
  'AiBhive is an app factory. Describe what you want — most apps appear inside AiBhive in seconds, with their own name, icon, and color. You can use them right away, change them just by talking, and (when you are ready) publish them as a web link, a real Android app, or a Google Play listing.';

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'flow',
    title: '1. How to make an app',
    body: 'Three steps. No coding. No Play Store. No app updates required.',
    bullets: [
      'Tap the Build tab and describe your app in normal words. Example: "Make me a habit tracker for morning workouts."',
      'You will see a quote — most are about $1. Tiny ones start automatically.',
      'In a few seconds your app appears on the Apps tab with its own name, icon, and color.',
    ],
  },
  {
    id: 'open',
    title: '2. How to open your app',
    body: 'Tap the Apps tab at the bottom, then tap the card with your app\'s name. That is it.',
    bullets: [
      'Your app opens with its own colored header — that means it is YOUR app, not AiBhive.',
      'If your app has multiple pages, you will see tabs along the top — tap to switch.',
      'Your data stays on your phone. Close and reopen any time; everything is saved.',
    ],
  },
  {
    id: 'change',
    title: '3. How to change your app',
    body: 'Just tell the Hive what to change — on the Build tab.',
    bullets: [
      'Examples: "add a notes page", "change the theme to blue", "rename it to Daily Wins".',
      'Changes cost about 50 cents and apply in seconds. Your data stays.',
      'The Hive remembers your last app, so "change the theme to blue" works without naming the app.',
    ],
  },
  {
    id: 'export',
    title: '4. How to take your app outside AiBhive',
    body: 'When you love it, open your app and tap "Export" in the top right. You will see three choices:',
    bullets: [
      'Web link (~$5) — your app gets a website URL anyone can open. No install for anyone.',
      'Android app (~$18) — a real .apk file you install on your phone. Has its own icon on your home screen.',
      'Play Store ready (~$35) — we prepare the signed file + listing + step-by-step Google Play walkthrough.',
    ],
  },
  {
    id: 'web-steps',
    title: '5. If you pick "Web link"',
    body: 'Easiest option. About 20 minutes. We send you a link.',
    bullets: [
      'After you approve the quote, sit back. We will notify you when it is live.',
      'Open Apps → your app → Export → there will be a "Open web app" button and a URL to copy.',
      'Paste the link anywhere — text, email, social. People open it in their browser.',
      'To update: just keep tweaking inside AiBhive. The web version updates automatically the next time we publish.',
    ],
  },
  {
    id: 'apk-steps',
    title: '6. If you pick "Android app (APK)"',
    body: 'About 40 minutes. You get a download link.',
    bullets: [
      'Tap the download link on your phone — your browser will download a .apk file.',
      'If your phone asks "Allow install from this source?" — say YES (one-time).',
      'Tap the downloaded file → Install.',
      'You will see a new icon on your home screen with your app\'s name and color.',
      'Share the same .apk with friends so they can install it too.',
    ],
  },
  {
    id: 'play-steps',
    title: '7. If you pick "Play Store ready"',
    body: 'About an hour. You get a complete kit + step-by-step Google Play instructions.',
    bullets: [
      'You will get: a signed .aab file + your icon in every size + 4–6 screenshots + listing text + a numbered checklist.',
      'Sign up at play.google.com/console (Google charges a one-time $25 — that is them, not us).',
      'Open the checklist (PLAY_STORE_STEPS.md) — every step is numbered with what to copy/paste.',
      'Upload the .aab file → paste the listing text → upload the screenshots → submit for internal testing.',
      'When it looks good, push the same listing to production. Your app is live on Google Play.',
    ],
  },
  {
    id: 'price-table',
    title: '8. Pricing at a glance',
    body: 'Simple, predictable. You only pay when you approve.',
    bullets: [
      'New app (instant, in AiBhive): about $1.',
      'Small change to an existing app: about 50¢.',
      'Web link: about $5.',
      'Android app (APK): about $18.',
      'Play Store kit: about $35.',
      'You can use the in-AiBhive version forever without paying for an export.',
    ],
  },
  {
    id: 'credits',
    title: '10. Hive credits vs stand-alone apps',
    body: 'Your built app is free to use inside AiBhive. Credits only apply when you use cloud features.',
    bullets: [
      'Inside AiBhive: Hive credits meter assistant chat, cloud research, and paid builds — not opening your app day to day.',
      'Stand-alone export (APK or Play Store): your app runs from its own icon with data on your phone — no Hive credits for everyday use.',
      'Optional cloud AI inside an exported app would be separate; most spec apps work fully offline.',
    ],
  },
  {
    id: 'help',
    title: '11. Stuck?',
    body: 'Common fixes:',
    bullets: [
      'App not appearing in Apps tab — pull down to refresh, or wait 10 seconds for sync.',
      'Quote seems too high — be more specific. "Habit tracker for 3 habits" is cheaper than "fitness platform".',
      'Want it on iPhone too — ask for "web link". Web works on every phone.',
      'Lost data after switching phones — sign in with Google (Settings → Your account). Sync arrives in a near-future update.',
    ],
  },
];

export const DELIVERY_OPTIONS_SUMMARY = [
  { key: 'in-app', label: 'Inside AiBhive', status: 'Instant', desc: '~$1 · usable in seconds' },
  { key: 'web', label: 'Web link', status: '~20 min', desc: '~$5 · URL anyone can open' },
  { key: 'apk', label: 'Android app', status: '~40 min', desc: '~$18 · installable .apk' },
  { key: 'play', label: 'Play Store', status: '~1 hour', desc: '~$35 · ready to publish' },
];
