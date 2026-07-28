import { extractFeatures } from './feature-extractor';
import type {
  AimFrame,
  CheatClass,
  ControllerSample,
  DetectionResult,
  ExtractedFeatures,
} from './types';

export class CheatDetector {
  detect(samples: ControllerSample[], aimFrames?: AimFrame[]): DetectionResult {
    const features = extractFeatures(samples, aimFrames);
    const scores = scoreAll(features);

    const ranked = Object.entries(scores)
      .filter(([k]) => k !== 'clean')
      .sort((a, b) => b[1] - a[1]);

    const [topClass, topScore] = ranked[0] ?? ['clean', 0];
    const cleanScore = scores.clean ?? 0;

    let cheatClass: CheatClass | 'unknown' | 'clean' = 'clean';
    let confidence = cleanScore;

    if (topScore >= 0.45 && topScore > cleanScore + 0.1) {
      cheatClass = topClass as CheatClass;
      confidence = topScore;
    }

    return {
      cheatClass,
      confidence,
      scores,
      features,
    };
  }
}

function scoreAll(features: ExtractedFeatures): Record<string, number> {
  const cronusAr = scoreCronusAntiRecoil(features);
  const cronusPolar = scoreCronusPolar(features);
  const cronusFull = Math.min(1, cronusAr * 0.6 + cronusPolar * 0.6);
  const cvSoft = scoreCvSoft(features);
  const cvSnap = scoreCvSnap(features);
  const memory = scoreMemoryAimbot(features);
  const clean = scoreClean(features, Math.max(cronusAr, cronusPolar, cvSoft, cvSnap, memory));

  return {
    clean,
    cronus_antirecoil: cronusAr,
    cronus_polar_aa: cronusPolar,
    cronus_full: cronusFull,
    cv_aimbot_soft: cvSoft,
    cv_aimbot_snap: cvSnap,
    memory_aimbot: memory,
  };
}

function scoreCronusAntiRecoil(f: ExtractedFeatures): number {
  if (f.recoilCompensationMean < 8) return 0;
  const magnitude = Math.min(1, f.recoilCompensationMean / 16);
  const consistency = f.recoilCompensationStd < 14 ? 1 : 0.4;
  return magnitude * consistency;
}

function scoreCronusPolar(f: ExtractedFeatures): number {
  if (f.polarPeriodicity < 0.12) return 0;
  if (f.cvLagMs > 40) return 0;
  if (f.trackingSmoothness > 0.62) return 0;
  return Math.min(1, f.polarPeriodicity * 1.8);
}

function scoreCvSoft(f: ExtractedFeatures): number {
  if (f.cvLagMs < 35) return 0;
  const lagScore = Math.min(1, f.cvLagMs / 55);
  const trackScore = Math.min(1, f.trackingSmoothness);
  const notSnap = f.maxAngularVelocity < 250 ? 0.35 : 0;
  return Math.min(1, lagScore * 0.55 + trackScore * 0.3 + notSnap);
}

function scoreCvSnap(f: ExtractedFeatures): number {
  if (f.maxAngularVelocity < 180) return 0;
  const snap = Math.min(1, f.maxAngularVelocity / 500);
  const lag = f.cvLagMs >= 15 ? 0.3 : 0;
  if (f.polarPeriodicity > 0.5 && f.cvLagMs > 50) return 0;
  return Math.min(1, snap * 0.75 + lag);
}

function scoreMemoryAimbot(f: ExtractedFeatures): number {
  if (f.cvLagMs > 45 && f.maxAngularVelocity < 800) return 0;
  if (f.polarPeriodicity > 0.4 && f.maxAngularVelocity < 800) return 0;
  const preAim = f.preAimScore >= 0.25 ? Math.min(1, f.preAimScore * 2) : 0;
  const snap =
    f.maxAngularVelocity >= 220 ? Math.min(1, f.maxAngularVelocity / 450) : 0;
  if (preAim < 0.2 && snap < 0.45) return 0;
  if (f.recoilCompensationMean > 8) return 0;
  const lowLag = f.cvLagMs < 25 ? 0.25 : 0;
  const instantSnap = f.maxAngularVelocity >= 800 ? 0.35 : 0;
  return Math.min(1, preAim * 0.55 + snap * 0.5 + lowLag + instantSnap);
}

function scoreClean(f: ExtractedFeatures, cheatMax: number): number {
  const natural =
    f.recoilCompensationMean < 6 &&
    f.polarPeriodicity < 0.12 &&
    f.cvLagMs < 30
      ? 0.5
      : 0.15;
  return Math.max(0, Math.min(1, 1 - cheatMax + natural));
}
