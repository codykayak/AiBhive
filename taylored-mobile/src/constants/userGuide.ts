/** User Guide copy — how Hive builds become usable apps. */

export type GuideSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
};

export const USER_GUIDE_INTRO =
  'AiBhive is an app factory. You describe what you want; we build it. This guide explains what happens after you tap Approve & Build — and how you actually use what we make.';

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'flow',
    title: '1. The build loop (start here)',
    body: 'Every custom app follows the same simple loop:',
    bullets: [
      'Build tab → describe your app in plain English (attach a screenshot if you have one).',
      'Review the quote → tap Approve & Build.',
      'Wait for the ding — status moves to Building in My Apps.',
      'When status shows Ready, your feature is built in the cloud.',
      'Install the latest AiBhive update (Settings → Check for updates) to open it inside this app.',
      'Want changes? Describe them on Build — we quote the next iteration.',
    ],
  },
  {
    id: 'my-apps',
    title: '2. What My Apps means',
    body: 'My Apps is your project shelf — not the App Store.',
    bullets: [
      'Building — our cloud agent is coding your feature right now.',
      'Ready — the build finished. Install the newest AiBhive package to use it here.',
      'Starter tools (Job Tracker, Resume) are examples already inside AiBhive.',
      'Chat questions and quotes do not appear here — only real builds.',
    ],
  },
  {
    id: 'inside-aibhive',
    title: '3. Using apps inside AiBhive (available today)',
    body: 'This is our main delivery path and what we recommend for phone-first tools.',
    bullets: [
      'Your feature becomes a new screen or module inside AiBhive — same install, amber Hive look.',
      'After we ship an update, tap the app card in My Apps to open it (coming: one-tap open as routes land).',
      'Small UI fixes can arrive over-the-air without a full reinstall when OTA is enabled.',
      'Best for: habit trackers, expense logs, interview prep, job tools, personal dashboards.',
    ],
  },
  {
    id: 'web',
    title: '4. Web apps & your own domain (on the roadmap)',
    body: 'For shareable links or desktop use, we are adding web delivery:',
    bullets: [
      'Option A — Hosted by AiBhive at a link you can share (e.g. apps.aibhive.com/your-name/my-tool).',
      'Option B — Export a zip you upload to your hosting (Netlify, Vercel, your domain).',
      'Good for: landing pages, calculators coworkers open in a browser, embeddable widgets.',
      'Tell us on Build: “ship this as a web app” when requesting — we will prioritize web output.',
    ],
  },
  {
    id: 'standalone',
    title: '5. Standalone APK / separate install (future)',
    body: 'A fully separate Android app with its own icon is possible but heavier:',
    bullets: [
      'Requires its own build, signing, and (optionally) Play Store listing.',
      'Best for products you want to sell or brand outside AiBhive.',
      'Higher quote than an in-app module — ask for “standalone APK” on Build when ready.',
      'Until then, in-app modules get you testing fastest.',
    ],
  },
  {
    id: 'today',
    title: '6. What you can do right now',
    body: 'Honest checklist for beta testers:',
    bullets: [
      '✓ Build & approve features on the Build tab.',
      '✓ Track progress in My Apps (Building → Ready).',
      '✓ Use Job Tracker and Auto-Bot Resume today.',
      '✓ Check Settings → App updates for new AiBhive installs.',
      '◐ Tap-to-open custom builds inside AiBhive — lands as updates ship.',
      '◐ Web export & your-domain hosting — next milestone.',
      '◐ Standalone APK per app — premium path later.',
    ],
  },
  {
    id: 'help',
    title: '7. Stuck?',
    body: 'If Ready but you do not see the feature yet, you likely need the latest AiBhive APK. If Building for a long time, try a smaller first version on Build. For billing or sign-in, use Settings → Your account.',
  },
];

export const DELIVERY_OPTIONS_SUMMARY = [
  { key: 'in-app', label: 'Inside AiBhive', status: 'Now', desc: 'Modules in this app after update' },
  { key: 'web', label: 'Web / your domain', status: 'Soon', desc: 'Shareable link or export zip' },
  { key: 'apk', label: 'Standalone APK', status: 'Later', desc: 'Separate install & branding' },
];
