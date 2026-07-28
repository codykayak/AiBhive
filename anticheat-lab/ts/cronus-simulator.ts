import { POLAR_ARRAY } from './polar-array';
import type { ControllerSample, CronusSimConfig } from './types';

const AR_RELEASE = 35;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Default matches claw-xbox-premium.gpc factory defaults. */
export const DEFAULT_CRONUS_CONFIG: CronusSimConfig = {
  antiRecoil: true,
  polarAa: true,
  hairTrigger: false,
  arVertical: 18,
  arHorizontal: 2,
  aaRadius: 12,
  aaSpeed: 18,
  vmSpeed: 3,
};

/**
 * Reimplements Cronus Zen GPC logic from claw-xbox-premium.gpc for lab telemetry.
 * Input samples are player intent; output is what the console would receive.
 */
export class CronusSimulator {
  private aaAngle = 0;
  private aaTime = 0;
  private antiRecoilActive = false;

  constructor(private config: CronusSimConfig = DEFAULT_CRONUS_CONFIG) {}

  setConfig(config: Partial<CronusSimConfig>): void {
    this.config = { ...this.config, ...config };
  }

  process(raw: ControllerSample): ControllerSample {
    let rx = raw.rx;
    let ry = raw.ry;
    let lx = raw.lx;
    let ly = raw.ly;
    let ads = raw.ads;
    let fire = raw.fire;

    if (this.config.hairTrigger && ads > 20) {
      ads = 100;
    }

    const firing = ads > 20 && fire > 20;

    if (this.config.antiRecoil && firing) {
      this.antiRecoilActive = true;
      ry = clamp(ry + this.config.arVertical, -100, 100);
      rx = clamp(rx + this.config.arHorizontal, -100, 100);
    }

    if (Math.abs(raw.ry) > AR_RELEASE || Math.abs(raw.rx) > AR_RELEASE) {
      this.antiRecoilActive = false;
    }

    if (this.config.polarAa) {
      const polar = this.runPolarAa(rx, ry);
      rx = polar.rx;
      ry = polar.ry;
    }

    return {
      tMs: raw.tMs,
      rx,
      ry,
      lx,
      ly,
      ads,
      fire,
      label: raw.label,
    };
  }

  processStream(samples: ControllerSample[]): ControllerSample[] {
    return samples.map((s) => this.process(s));
  }

  private runPolarAa(rx: number, ry: number): { rx: number; ry: number } {
    const magnitude = Math.sqrt(rx * rx + ry * ry);

    if (this.aaTime++ % 1 === 0) {
      this.aaAngle += this.config.aaSpeed;
    }
    this.aaAngle = this.aaAngle % 360;

    const sinBase = POLAR_ARRAY[this.aaAngle % 360];
    const cosBase = POLAR_ARRAY[(this.aaAngle + 270) % 360];
    let aaSin = (sinBase * this.config.aaRadius) / 100;
    let aaCos = (cosBase * this.config.aaRadius) / 100;

    if (magnitude <= this.config.aaRadius) {
      aaSin = aaSin - ry;
      aaCos = aaCos - rx;
    }

    return {
      rx: clamp(rx + aaCos, -100, 100),
      ry: clamp(ry + aaSin, -100, 100),
    };
  }
}
