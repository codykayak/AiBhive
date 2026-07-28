import type { AimFrame, ControllerSample, CvAimbotSimConfig } from './types';

/** CV capture-card aimbot kinematics — lab simulator, not live injection. */
export const DEFAULT_CV_CONFIG: CvAimbotSimConfig = {
  lagMs: 55,
  roiSize: 320,
  snapThresholdDeg: 8,
  smoothing: 0.35,
  captureLagMs: 25,
  inferenceMs: 12,
};

export class CvAimbotSimulator {
  private smoothedYaw = 0;
  private smoothedPitch = 0;
  private lagBuffer: Array<{ tMs: number; yaw: number; pitch: number }> = [];

  constructor(private config: CvAimbotSimConfig = DEFAULT_CV_CONFIG) {}

  setConfig(config: Partial<CvAimbotSimConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Converts aim frames (ground truth) into right-stick corrections
   * mimicking ROI-limited YOLO + lagged tracking.
   */
  processFrames(frames: AimFrame[]): ControllerSample[] {
    const totalLag = this.config.captureLagMs + this.config.inferenceMs + this.config.lagMs;
    const out: ControllerSample[] = [];

    for (const frame of frames) {
      this.lagBuffer.push({
        tMs: frame.tMs,
        yaw: frame.enemyYawDelta,
        pitch: frame.enemyPitchDelta,
      });

      const targetTime = frame.tMs - totalLag;
      const delayed = this.sampleDelayed(targetTime);

      let targetYaw = 0;
      let targetPitch = 0;

      if (frame.enemyVisible && delayed) {
        const inRoi =
          Math.abs(delayed.yaw) <= this.degreesForRoi(this.config.roiSize) &&
          Math.abs(delayed.pitch) <= this.degreesForRoi(this.config.roiSize);

        if (inRoi) {
          targetYaw = delayed.yaw;
          targetPitch = delayed.pitch;
        }
      }

      const snap = Math.abs(targetYaw - this.smoothedYaw) > this.config.snapThresholdDeg;
      const alpha = snap ? 0.85 : this.config.smoothing;

      this.smoothedYaw += alpha * (targetYaw - this.smoothedYaw);
      this.smoothedPitch += alpha * (targetPitch - this.smoothedPitch);

      const rx = clampStick(this.smoothedYaw * 2.2);
      const ry = clampStick(-this.smoothedPitch * 2.2);

      out.push({
        tMs: frame.tMs,
        rx,
        ry,
        lx: 0,
        ly: 0,
        ads: frame.playerFiring ? 100 : 0,
        fire: frame.playerFiring ? 100 : 0,
        label: snap ? 'cv_aimbot_snap' : 'cv_aimbot_soft',
      });
    }

    return out;
  }

  private sampleDelayed(targetTime: number): { yaw: number; pitch: number } | null {
    let best: { yaw: number; pitch: number } | null = null;
    let bestDt = Infinity;

    for (const entry of this.lagBuffer) {
      const dt = Math.abs(entry.tMs - targetTime);
      if (dt < bestDt) {
        bestDt = dt;
        best = { yaw: entry.yaw, pitch: entry.pitch };
      }
    }

    return bestDt < 50 ? best : null;
  }

  /** Rough FOV mapping: smaller ROI = fewer off-center detections. */
  private degreesForRoi(roiPx: number): number {
    return (roiPx / 1080) * 40;
  }
}

function clampStick(v: number): number {
  return Math.max(-100, Math.min(100, v));
}
