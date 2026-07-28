/**
 * Run detector on JSON telemetry from Python lab_capture.py
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CheatDetector } from './detector';
import type { ControllerSample } from './types';

const path = process.argv[2] ?? 'anticheat-lab/fixtures/capture_telemetry.json';
const fullPath = resolve(process.cwd(), path);

const raw = JSON.parse(readFileSync(fullPath, 'utf8'));
const samples: ControllerSample[] = raw.samples;

const detector = new CheatDetector();
const result = detector.detect(samples);

console.log('Capture telemetry analysis');
console.log('File:', fullPath);
console.log('Samples:', samples.length);
if (raw.meta) {
  console.log('Avg loop ms:', raw.meta.avgLoopMs?.toFixed?.(1) ?? raw.meta.avgLoopMs);
}
console.log('\nDetection:');
console.log('  Class:      ', result.cheatClass);
console.log('  Confidence: ', result.confidence.toFixed(3));
console.log('  Scores:     ', result.scores);
console.log('\nFeatures:');
for (const [k, v] of Object.entries(result.features)) {
  console.log(`  ${k}: ${typeof v === 'number' ? v.toFixed(3) : v}`);
}
