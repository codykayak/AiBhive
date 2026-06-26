#!/usr/bin/env node
/** Generate a short two-tone "hive" chime WAV for notification sounds. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'taylored-mobile/assets/sounds/hive_chime.wav');

const sampleRate = 44100;
const durationSec = 0.55;
const numSamples = Math.floor(sampleRate * durationSec);

function tone(freq, start, len, volume = 0.35) {
  const buf = new Float32Array(numSamples);
  for (let i = start; i < start + len && i < numSamples; i += 1) {
    const t = (i - start) / sampleRate;
    const env = Math.min(1, t * 40) * Math.exp(-t * 5.5);
    buf[i] += Math.sin(2 * Math.PI * freq * t) * volume * env;
  }
  return buf;
}

const mix = new Float32Array(numSamples);
const a = tone(880, 0, Math.floor(sampleRate * 0.22), 0.32);
const b = tone(1174.66, Math.floor(sampleRate * 0.12), Math.floor(sampleRate * 0.38), 0.28);
for (let i = 0; i < numSamples; i += 1) {
  mix[i] = (a[i] || 0) + (b[i] || 0);
}

const pcm = Buffer.alloc(numSamples * 2);
for (let i = 0; i < numSamples; i += 1) {
  const s = Math.max(-1, Math.min(1, mix[i]));
  pcm.writeInt16LE(Math.round(s * 32767 * 0.9), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.concat([header, pcm]));
console.log('Wrote', outPath, `(${(header.length + pcm.length) / 1024} KB)`);
