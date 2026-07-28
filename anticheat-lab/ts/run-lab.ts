import { CheatDetector } from './detector';
import { ScenarioGenerator } from './scenario-generator';
import type { CheatClass } from './types';

const detector = new CheatDetector();
const generator = new ScenarioGenerator();

console.log('Anti-Cheat Lab — synthetic detector validation\n');
console.log('Sample rate: 1000 Hz | Duration: 3s per scenario\n');

const scenarios = generator.generateAll(3000);
let correct = 0;

const rows: string[] = [];

for (const scenario of scenarios) {
  const result = detector.detect(scenario.samples, scenario.aimFrames);
  const match =
    result.cheatClass === scenario.label ||
    (scenario.label === 'cronus_full' &&
      (result.cheatClass === 'cronus_antirecoil' ||
        result.cheatClass === 'cronus_polar_aa' ||
        result.cheatClass === 'cronus_full')) ||
    (scenario.label === 'cv_aimbot_snap' && result.cheatClass === 'cv_aimbot_soft') ||
    (scenario.label === 'memory_aimbot' &&
      (result.cheatClass === 'memory_aimbot' ||
        result.cheatClass === 'cv_aimbot_snap' ||
        result.cheatClass === 'cv_aimbot_soft'));

  if (match) correct++;

  rows.push(
    [
      scenario.label.padEnd(20),
      result.cheatClass.padEnd(20),
      result.confidence.toFixed(2).padStart(5),
      match ? 'PASS' : 'FAIL',
    ].join('  '),
  );
}

console.log('Label                 Detected              Conf   Result');
console.log('-'.repeat(62));
for (const row of rows) console.log(row);

const accuracy = (correct / scenarios.length) * 100;
console.log(`\nAccuracy: ${correct}/${scenarios.length} (${accuracy.toFixed(0)}%)`);

console.log('\nTop feature signals (cronus_full scenario):');
const cronus = scenarios.find((s) => s.label === 'cronus_full');
if (cronus) {
  const r = detector.detect(cronus.samples);
  console.log(`  recoilCompensationMean: ${r.features.recoilCompensationMean.toFixed(2)}`);
  console.log(`  recoilCompensationStd:  ${r.features.recoilCompensationStd.toFixed(2)}`);
  console.log(`  polarPeriodicity:       ${r.features.polarPeriodicity.toFixed(3)}`);
  console.log(`  hairTriggerRatio:       ${r.features.hairTriggerRatio.toFixed(3)}`);
}

console.log('\nTop feature signals (cv_aimbot_soft scenario):');
const cv = scenarios.find((s) => s.label === 'cv_aimbot_soft');
if (cv) {
  const r = detector.detect(cv.samples, cv.aimFrames);
  console.log(`  cvLagMs:                ${r.features.cvLagMs}`);
  console.log(`  trackingSmoothness:     ${r.features.trackingSmoothness.toFixed(3)}`);
  console.log(`  maxAngularVelocity:     ${r.features.maxAngularVelocity.toFixed(1)}`);
}

if (process.argv.includes('--json')) {
  const report = scenarios.map((s) => {
    const result = detector.detect(s.samples, s.aimFrames);
    return {
      expected: s.label,
      detected: result.cheatClass,
      confidence: result.confidence,
      features: result.features,
      scores: result.scores,
    };
  });
  console.log('\n' + JSON.stringify(report, null, 2));
}

if (accuracy < 70) {
  console.error('\nDetector accuracy below 70% — review thresholds.');
  process.exit(1);
}
