#!/usr/bin/env node
/**
 * Generate iridology topic + featured essay hero images.
 * Uses Grok Imagine when XAI_API_KEY is set; otherwise writes themed SVG placeholders.
 *
 *   node scripts/generate-iridology-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/oregon-plant-medicine/iridology');
const XAI_BASE = 'https://api.x.ai/v1';
const IMAGE_MODEL = process.env.GROK_IMAGE_MODEL || 'grok-imagine-image-quality';

const TOPICS = [
  {
    id: 'integrated-methodology',
    title: 'Integrated iridology',
    prompt:
      'Educational medical illustration: human iris close-up overlaid with subtle clock-face zone chart lines, indigo and violet palette, soft scientific diagram style, no text, no watermark, holistic wellness aesthetic',
  },
  {
    id: 'jensen-zone-chart',
    title: 'Bernard Jensen zone chart',
    prompt:
      'Artistic iridology zone chart diagram on dark background, radial organ sectors on a blue iris, vintage anatomical education style, indigo gold accents, no readable text labels',
  },
  {
    id: 'physical-european-signs',
    title: 'Physical iridology signs',
    prompt:
      'Macro photograph style illustration of iris stromal fibers, lacunae pits and nerve rings, European physical iridology, deep indigo eye, educational texture detail, no text',
  },
  {
    id: 'constitutional-types',
    title: 'Constitutional iris types',
    prompt:
      'Three stylized irises side by side showing lymphatic blue-grey, biliary mixed brown, hematogenic brown dense fibers, educational comparison chart aesthetic, dark background',
  },
  {
    id: 'iris-photo-guide',
    title: 'Iris photo capture',
    prompt:
      'Smartphone photographing human eye in soft window light, circular iris framing guide overlay, educational how-to illustration, indigo UI accents, clean modern style',
  },
  {
    id: 'iridology-safety-limits',
    title: 'Iridology safety',
    prompt:
      'Calm educational illustration: human eye with gentle amber caution glow and stethoscope silhouette nearby, not alarming, indigo safety theme, wellness disclaimer aesthetic, no text',
  },
  {
    id: 'rayid-personality-read',
    title: 'Rayid personality iridology',
    prompt:
      'Abstract artistic iris with jewel and flower petal patterns inside, personality iridology Rayid style, violet rose gold palette, non-medical reflective mood, no text',
  },
  {
    id: 'left-right-eye-reading',
    title: 'Left and right iris comparison',
    prompt:
      'Pair of human eyes left and right with subtle mirrored zone mapping lines, bilateral iridology comparison, indigo educational diagram, dark background, no text',
  },
  {
    id: 'ai-iridology-featured',
    title: 'AI Iridology on AiBhive',
    prompt:
      'Hero banner: luminous human iris with AI neural network light trails and camera lens ring, futuristic holistic health education, indigo violet gradient, premium app feature art, no text no logo',
  },
];

function svgPlaceholder(id, title) {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 60;
  const h1 = 230 + hue;
  const h2 = 260 + hue;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${h1},45%,12%)"/>
      <stop offset="100%" stop-color="hsl(${h2},55%,22%)"/>
    </linearGradient>
    <radialGradient id="iris" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${h1},70%,55%)"/>
      <stop offset="70%" stop-color="hsl(${h2},60%,35%)"/>
      <stop offset="100%" stop-color="hsl(${h1},50%,15%)"/>
    </radialGradient>
  </defs>
  <rect width="960" height="540" fill="url(#bg)"/>
  <circle cx="480" cy="250" r="120" fill="url(#iris)" opacity="0.95"/>
  <circle cx="480" cy="250" r="118" fill="none" stroke="hsl(${h2},80%,70%)" stroke-width="2" opacity="0.4"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x1 = 480 + Math.cos(a) * 40;
    const y1 = 250 + Math.sin(a) * 40;
    const x2 = 480 + Math.cos(a) * 115;
    const y2 = 250 + Math.sin(a) * 115;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="hsl(${h1},60%,60%)" stroke-width="1" opacity="0.35"/>`;
  }).join('\n  ')}
  <text x="480" y="430" text-anchor="middle" fill="hsl(${h2},30%,88%)" font-family="system-ui,sans-serif" font-size="22" font-weight="700">${title.replace(/&/g, '&amp;')}</text>
  <text x="480" y="460" text-anchor="middle" fill="hsl(${h1},25%,65%)" font-family="system-ui,sans-serif" font-size="13">AiBhive Living Knowledge · Iridology</text>
</svg>`;
}

async function grokGenerateImage(apiKey, prompt) {
  const res = await fetch(`${XAI_BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      aspect_ratio: '16:9',
      response_format: 'b64_json',
      n: 1,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Grok image API ${res.status}`);
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image in Grok response');
  return Buffer.from(b64, 'base64');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const apiKey = process.env.XAI_API_KEY || '';
  const mode = apiKey ? 'grok' : 'svg';
  console.log(`Generating iridology images (${mode}) → ${OUT_DIR}`);

  for (const topic of TOPICS) {
    const jpgPath = path.join(OUT_DIR, `${topic.id}.jpg`);
    const svgPath = path.join(OUT_DIR, `${topic.id}.svg`);
    try {
      if (apiKey) {
        const buf = await grokGenerateImage(apiKey, topic.prompt);
        fs.writeFileSync(jpgPath, buf);
        if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
        console.log(`  ✓ ${topic.id}.jpg (Grok)`);
      } else {
        fs.writeFileSync(svgPath, svgPlaceholder(topic.id, topic.title));
        console.log(`  ✓ ${topic.id}.svg (placeholder — set XAI_API_KEY for Grok JPG)`);
      }
    } catch (err) {
      console.warn(`  ! ${topic.id}: ${err.message} — writing SVG fallback`);
      fs.writeFileSync(svgPath, svgPlaceholder(topic.id, topic.title));
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
