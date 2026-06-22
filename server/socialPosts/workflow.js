/** Pipeline steps shown in admin UI */
export const WORKFLOW_PIPELINE = [
  {
    id: 'topic',
    label: 'Pick topic',
    description: 'Rotates through topics in autoposter/functions/config/topics.json for today\'s angle.',
  },
  {
    id: 'research',
    label: 'Research news',
    description: 'Gemini searches the web for a recent article, verifies the URL, and summarizes it.',
  },
  {
    id: 'captions',
    label: 'Write captions',
    description: 'Generates Facebook, Instagram, and X copy using brand voice + knowledge.txt.',
  },
  {
    id: 'images',
    label: 'Generate images',
    description: 'Creates branded images per platform (16:9 FB/X, 4:5 IG) and uploads to aibhive-media.',
  },
  {
    id: 'review',
    label: 'Review & approve',
    description: 'You edit captions, copy text, download images, and approve before posting.',
  },
  {
    id: 'publish',
    label: 'Post to social',
    description: 'Open your linked profiles, paste copy, upload images. Mark as posted when done.',
  },
];

export const DEFAULT_SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  x: '',
};

export function buildPlatformPostUrl(platform, caption, socialLinks = {}) {
  const links = { ...DEFAULT_SOCIAL_LINKS, ...socialLinks };
  const text = String(caption || '').trim();

  if (platform === 'x') {
    const params = new URLSearchParams();
    if (text) params.set('text', text.slice(0, 280));
    const qs = params.toString();
    return qs ? `https://twitter.com/intent/tweet?${qs}` : (links.x || 'https://twitter.com/compose/tweet');
  }

  if (platform === 'facebook') {
    return links.facebook || 'https://www.facebook.com/';
  }

  if (platform === 'instagram') {
    return links.instagram || 'https://www.instagram.com/';
  }

  return links[platform] || '#';
}
