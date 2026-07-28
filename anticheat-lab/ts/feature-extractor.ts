import type { AimFrame, ControllerSample, ExtractedFeatures } from './types';

export function extractFeatures(
  samples: ControllerSample[],
  aimFrames?: AimFrame[],
): ExtractedFeatures {
  const recoil = recoilStats(samples);
  const polarPeriodicity = polarAutocorrelation(samples);
  const angular = angularVelocityStats(samples, aimFrames);
  const preAim = aimFrames ? preAimScore(aimFrames) : 0;
  const cvLag = aimFrames ? estimateCvLag(samples, aimFrames) : 0;
  const hairTriggerRatio = hairTriggerStats(samples);

  return {
    recoilCompensationMean: recoil.mean,
    recoilCompensationStd: recoil.std,
    polarPeriodicity,
    maxAngularVelocity: angular.maxVel,
    trackingSmoothness: angular.smoothness,
    preAimScore: preAim,
    cvLagMs: cvLag,
    hairTriggerRatio,
  };
}

function recoilStats(samples: ControllerSample[]): { mean: number; std: number } {
  const firingRy: number[] = [];
  const idleRy: number[] = [];

  for (const s of samples) {
    if (s.fire > 20 && s.ads > 20) firingRy.push(s.ry);
    else idleRy.push(s.ry);
  }

  if (firingRy.length === 0) return { mean: 0, std: 0 };

  const idleMean =
    idleRy.length > 0 ? idleRy.reduce((a, b) => a + b, 0) / idleRy.length : 0;
  const compensated = firingRy.map((ry) => ry - idleMean);
  const mean = compensated.reduce((a, b) => a + b, 0) / compensated.length;
  const variance =
    compensated.reduce((acc, d) => acc + (d - mean) ** 2, 0) / compensated.length;

  return { mean, std: Math.sqrt(variance) };
}

function polarAutocorrelation(samples: ControllerSample[]): number {
  const rxSeries: number[] = [];
  for (const s of samples) {
    if (s.ads > 20) rxSeries.push(s.rx);
  }
  if (rxSeries.length < 40) return 0;

  const period = 20; // ~360/18 AA_speed steps per rotation at 1kHz
  const mean = rxSeries.reduce((a, b) => a + b, 0) / rxSeries.length;
  let correlation = 0;
  let norm = 0;
  let pairs = 0;

  for (let i = period; i < rxSeries.length; i++) {
    const a = rxSeries[i] - mean;
    const b = rxSeries[i - period] - mean;
    correlation += a * b;
    norm += a * a;
    pairs++;
  }

  if (pairs === 0 || norm < 1e-6) return 0;
  return Math.min(1, Math.abs(correlation / norm));
}

function angularVelocityStats(
  samples: ControllerSample[],
  aimFrames?: AimFrame[],
): { maxVel: number; smoothness: number } {
  if (aimFrames && aimFrames.length > 1) {
    const velocities: number[] = [];

    for (let i = 1; i < aimFrames.length; i++) {
      const dt = (aimFrames[i].tMs - aimFrames[i - 1].tMs) / 1000;
      if (dt <= 0) continue;
      const dyaw = aimFrames[i].cameraYaw - aimFrames[i - 1].cameraYaw;
      velocities.push(Math.abs(dyaw / dt));
    }

    return velocitySummary(velocities);
  }

  const velocities: number[] = [];
  const windowMs = 16;

  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i];
    const prev = samples.find((s) => s.tMs <= cur.tMs - windowMs && s.tMs < cur.tMs);
    if (!prev) continue;
    const dt = (cur.tMs - prev.tMs) / 1000;
    if (dt <= 0) continue;
    const drx = cur.rx - prev.rx;
    velocities.push(Math.abs((drx * 3.5) / dt));
  }

  return velocitySummary(velocities);
}

function velocitySummary(velocities: number[]): { maxVel: number; smoothness: number } {
  if (velocities.length === 0) return { maxVel: 0, smoothness: 0 };
  velocities.sort((a, b) => a - b);
  const p95 = velocities[Math.floor(velocities.length * 0.95)] ?? velocities[velocities.length - 1];
  return { maxVel: p95, smoothness: trackingSmoothness(velocities) };
}

function trackingSmoothness(velocities: number[]): number {
  if (velocities.length < 3) return 0;
  const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const variance =
    velocities.reduce((acc, v) => acc + (v - mean) ** 2, 0) / velocities.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  return Math.max(0, Math.min(1, 1 - cv));
}

function preAimScore(frames: AimFrame[]): number {
  let hits = 0;
  let total = 0;

  for (const f of frames) {
    if (!f.playerFiring) continue;
    total++;
    if (!f.enemyVisible && Math.abs(f.enemyYawDelta) < 3) hits++;
  }

  return total > 0 ? hits / total : 0;
}

function estimateCvLag(samples: ControllerSample[], frames: AimFrame[]): number {
  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = 0; lag <= 120; lag += 5) {
    let corr = 0;
    let n = 0;

    for (const s of samples) {
      const frame = frames.find((f) => f.tMs === s.tMs);
      if (!frame || !frame.enemyVisible) continue;
      const delayed = frames.find((f) => f.tMs === s.tMs - lag);
      if (!delayed) continue;
      corr += s.rx * delayed.enemyYawDelta;
      n++;
    }

    if (n > 0 && corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  return bestLag;
}

function hairTriggerStats(samples: ControllerSample[]): number {
  if (samples.length === 0) return 0;
  let binary = 0;
  for (const s of samples) {
    if (s.ads === 0 || s.ads === 100) binary++;
  }
  return binary / samples.length;
}
