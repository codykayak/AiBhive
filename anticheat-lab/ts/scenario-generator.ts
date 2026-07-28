import { CronusSimulator, DEFAULT_CRONUS_CONFIG } from './cronus-simulator';
import { CvAimbotSimulator, DEFAULT_CV_CONFIG } from './cv-aimbot-simulator';
import type { AimFrame, CheatClass, ControllerSample } from './types';

const SAMPLE_RATE_HZ = 1000;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE_HZ;

export interface ScenarioResult {
  label: CheatClass;
  samples: ControllerSample[];
  aimFrames?: AimFrame[];
}

/** Generates labeled synthetic telemetry for detector validation. */
export class ScenarioGenerator {
  generate(label: CheatClass, durationMs = 3000): ScenarioResult {
    switch (label) {
      case 'clean':
        return { label, samples: this.generateClean(durationMs) };
      case 'cronus_antirecoil':
        return this.generateCronus(durationMs, { polarAa: false });
      case 'cronus_polar_aa':
        return this.generateCronus(durationMs, { antiRecoil: false });
      case 'cronus_full':
        return this.generateCronus(durationMs, {});
      case 'cv_aimbot_soft':
        return this.generateCv(durationMs, { snapThresholdDeg: 50 });
      case 'cv_aimbot_snap':
        return this.generateCv(durationMs, { snapThresholdDeg: 4, lagMs: 40 });
      case 'memory_aimbot':
        return this.generateMemoryAimbot(durationMs);
      default:
        return { label: 'clean', samples: this.generateClean(durationMs) };
    }
  }

  generateAll(durationMs = 3000): ScenarioResult[] {
    const labels: CheatClass[] = [
      'clean',
      'cronus_antirecoil',
      'cronus_polar_aa',
      'cronus_full',
      'cv_aimbot_soft',
      'cv_aimbot_snap',
      'memory_aimbot',
    ];
    return labels.map((label) => this.generate(label, durationMs));
  }

  private generateClean(durationMs: number): ControllerSample[] {
    const samples: ControllerSample[] = [];
    let t = 0;

    while (t < durationMs) {
      const firing = t > 500 && t < 2500;
      samples.push({
        tMs: t,
        rx: noise(8),
        ry: noise(8) + (firing ? noise(3) : 0),
        lx: noise(5),
        ly: -30 + noise(4),
        ads: firing ? 100 : 0,
        fire: firing ? 80 + noise(10) : 0,
        label: 'clean',
      });
      t += SAMPLE_INTERVAL_MS;
    }

    return samples;
  }

  private generateCronus(
    durationMs: number,
    overrides: Partial<typeof DEFAULT_CRONUS_CONFIG>,
  ): ScenarioResult {
    const raw = this.generateClean(durationMs);
    const sim = new CronusSimulator({ ...DEFAULT_CRONUS_CONFIG, ...overrides });
    const label = overrides.polarAa === false
      ? 'cronus_antirecoil'
      : overrides.antiRecoil === false
        ? 'cronus_polar_aa'
        : 'cronus_full';

    return {
      label,
      samples: sim.processStream(raw).map((s) => ({ ...s, label })),
    };
  }

  private generateCv(
    durationMs: number,
    overrides: Partial<typeof DEFAULT_CV_CONFIG>,
  ): ScenarioResult {
    const fast = (overrides.snapThresholdDeg ?? DEFAULT_CV_CONFIG.snapThresholdDeg) <= 10;
    const frames = this.generateAimScenario(durationMs, { fastEnemy: fast });
    const sim = new CvAimbotSimulator({ ...DEFAULT_CV_CONFIG, ...overrides });
    const samples = sim.processFrames(frames);
    const label =
      (overrides.snapThresholdDeg ?? DEFAULT_CV_CONFIG.snapThresholdDeg) <= 10
        ? 'cv_aimbot_snap'
        : 'cv_aimbot_soft';

    return {
      label,
      samples: samples.map((s) => ({ ...s, label })),
      aimFrames: frames,
    };
  }

  private generateMemoryAimbot(durationMs: number): ScenarioResult {
    const frames: AimFrame[] = [];
    let t = 0;
    let cameraYaw = 0;

    while (t < durationMs) {
      const enemyYaw = Math.sin(t / 400) * 15;
      const visible = t > 300;
      const firing = t > 800 && t < 2200;
      const snapEvent = visible && Math.abs(enemyYaw - cameraYaw) > 10;

      if (snapEvent) {
        cameraYaw = enemyYaw;
      } else if (visible) {
        cameraYaw += (enemyYaw - cameraYaw) * 0.05;
      }

      frames.push({
        tMs: t,
        cameraYaw,
        cameraPitch: 0,
        enemyYawDelta: enemyYaw - cameraYaw,
        enemyPitchDelta: Math.sin(t / 500) * 4,
        enemyVisible: visible,
        playerFiring: firing,
      });

      t += SAMPLE_INTERVAL_MS;
    }

    const samples: ControllerSample[] = frames.map((f) => ({
      tMs: f.tMs,
      rx: clamp(f.enemyVisible ? f.enemyYawDelta * 4 : 0),
      ry: clamp(f.enemyVisible ? -f.enemyPitchDelta * 4 : 0),
      lx: 0,
      ly: 0,
      ads: f.playerFiring ? 100 : 0,
      fire: f.playerFiring ? 100 : 0,
      label: 'memory_aimbot' as const,
    }));

    return { label: 'memory_aimbot', samples, aimFrames: frames };
  }

  private generateAimScenario(
    durationMs: number,
    opts?: { instant?: boolean; fastEnemy?: boolean },
  ): AimFrame[] {
    const frames: AimFrame[] = [];
    let t = 0;
    let cameraYaw = 0;
    const freq = opts?.fastEnemy ? 80 : 400;

    while (t < durationMs) {
      const enemyYaw = Math.sin(t / freq) * (opts?.fastEnemy ? 25 : 15);
      const visible = t > 300;
      const firing = t > 800 && t < 2200;

      if (opts?.instant && visible) {
        cameraYaw = enemyYaw;
      } else {
        cameraYaw += (enemyYaw - cameraYaw) * 0.08;
      }

      frames.push({
        tMs: t,
        cameraYaw,
        cameraPitch: Math.sin(t / 600) * 3,
        enemyYawDelta: enemyYaw - cameraYaw,
        enemyPitchDelta: Math.sin(t / 500) * 4,
        enemyVisible: visible,
        playerFiring: firing,
      });

      t += SAMPLE_INTERVAL_MS;
    }

    return frames;
  }
}

function noise(scale: number): number {
  return (Math.random() - 0.5) * 2 * scale;
}

function clamp(v: number): number {
  return Math.max(-100, Math.min(100, v));
}
