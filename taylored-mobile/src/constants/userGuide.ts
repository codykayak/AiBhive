/** User Guide copy — how Hive builds become usable apps. */

export type GuideSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
};

export const USER_GUIDE_INTRO =
  'AiBhive is an app factory. You describe what you want; we build it, auto-merge it, and ship it to your phone in a few minutes. This guide explains the loop — and how to open what we make.';

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'flow',
    title: '1. The build loop (start here)',
    body: 'Every custom app follows the same simple loop:',
    bullets: [
      'Build tab → describe your app in plain English (attach a screenshot if you have one).',
      'Tiny tweaks (under ~$1.50) start automatically; bigger builds show a quote you tap to Approve.',
      'Status moves to Building in My Apps — the Hive picks the right delivery target (in-app screen, web link, or standalone APK).',
      'When the build finishes, we auto-merge it and ship an over-the-air update + a fresh APK. You get a phone notification.',
      'Tap the My Apps card — opens in AiBhive, on the web, or to your APK depending on the target.',
      'Want changes? Just describe them. Iteration edits the same project — quoted lower than a fresh build.',
    ],
  },
  {
    id: 'my-apps',
    title: '2. What My Apps means',
    body: 'My Apps is your launcher for everything the Hive has built for you.',
    bullets: [
      'Building — coding your feature in the cloud right now.',
      'Ready — auto-merged. JS-only builds reach your phone in ~2 min via OTA. Native builds appear after the new APK installs.',
      'Tap a Ready card to open it: in-app screens load instantly, web apps open in your browser, standalone APKs offer a download link.',
      'Starter tools (Job Tracker, Auto-Bot Resume) are examples already shipped in AiBhive.',
    ],
  },
  {
    id: 'inside-aibhive',
    title: '3. Inside AiBhive (in-app screens)',
    body: 'Best default for phone-first tools that need our chat/AI/Firebase plumbing.',
    bullets: [
      'Your feature becomes a new screen at userApps/<slug>/ — same install, amber Hive look.',
      'Tap "Open in AiBhive" on the build card — opens instantly once the OTA update lands.',
      'OTA delivers JS changes in ~2 minutes. Native changes (new icons, version bumps) need a new APK install — see Settings → Check for updates.',
      'Great for: habit trackers, expense logs, interview prep, job tools, personal dashboards.',
    ],
  },
  {
    id: 'web',
    title: '4. Web apps with a shareable link',
    body: 'Live now: a personal URL anyone can open in a browser.',
    bullets: [
      'Your build ships to https://aibhive.com/u/<your-id>/<slug>/ automatically when the target is "web app".',
      'Tap "Open web app" in My Apps to view, share or bookmark.',
      'Best for: landing pages, calculators, lead forms, dashboards, anything desktop or share-by-link.',
      'Sign in with Google for a pretty path; anonymous builds collapse to /u/shared/<slug>/.',
    ],
  },
  {
    id: 'standalone',
    title: '5. Standalone APK / your own Play Store app',
    body: 'A fully separate Android app with its own icon and Play Console listing.',
    bullets: [
      'We scaffold a new Expo project, signed with a fresh keystore, with your own bundle id.',
      'Output: a downloadable APK + steps for Play Internal Testing.',
      'Higher quote — separate build is ~$8–$25 instead of $1–$3 for an in-app screen.',
      'Ask for "standalone APK" or "my own app" on Build when ready.',
    ],
  },
  {
    id: 'play-store',
    title: '6. Putting AiBhive itself on the Play Store',
    body: 'The host app (AiBhive) is Play-Store-ready: package com.tayloredmobile.app, versioned AABs build via EAS, privacy policy at aibhive.com/privacy-policy.html.',
    bullets: [
      'Sideload track: install the latest APK from aibhive.com/download.html.',
      'Beta / Play track: see PLAY_STORE.md — EAS production AAB → Play Console internal testing.',
      'Every merge to main-fixed produces a fresh APK + .gz mirror + updated manifest at /api/mobile/releases.',
    ],
  },
  {
    id: 'today',
    title: '7. What you can do right now',
    body: 'Honest checklist after v1.4.0:',
    bullets: [
      '✓ Describe & build features on the Build tab.',
      '✓ Small builds auto-approve under $1.50.',
      '✓ My Apps cards open the deliverable (in-app, web, or APK).',
      '✓ Push notification fires when the build is ready.',
      '✓ Web builds reach a shareable URL within a few minutes.',
      '✓ Each merge auto-publishes a fresh AiBhive APK + .gz download.',
      '◐ Standalone Play Store apps per build — premium track, ask on Build.',
    ],
  },
  {
    id: 'help',
    title: '8. Stuck?',
    body: 'If Ready but you do not see the feature, give it ~2 min for OTA, then Settings → Check for updates. If Building for a long time, try a smaller first version on Build. For billing or sign-in, use Settings → Your account.',
  },
];

export const DELIVERY_OPTIONS_SUMMARY = [
  { key: 'in-app', label: 'Inside AiBhive', status: 'Live', desc: 'Auto-shipped via OTA in ~2 min' },
  { key: 'web', label: 'Web / shareable link', status: 'Live', desc: 'Opens at aibhive.com/u/.../...' },
  { key: 'apk', label: 'Standalone APK', status: 'Live', desc: 'Separate install & Play Store ready' },
];
