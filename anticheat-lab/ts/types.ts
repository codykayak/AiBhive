/** Lab telemetry types for anti-cheat research (synthetic + hardware capture). */

export type CheatClass =
  | 'clean'
  | 'cronus_antirecoil'
  | 'cronus_polar_aa'
  | 'cronus_full'
  | 'cv_aimbot_soft'
  | 'cv_aimbot_snap'
  | 'memory_aimbot'; // simulated kinematics only

export interface ControllerSample {
  tMs: number;
  rx: number; // -100..100 right stick X
  ry: number; // -100..100 right stick Y
  lx: number;
  ly: number;
  ads: number; // 0..100 (LB)
  fire: number; // 0..100 (RT)
  /** Ground-truth label when known (synthetic runs). */
  label?: CheatClass;
}

export interface AimFrame {
  tMs: number;
  cameraYaw: number; // degrees
  cameraPitch: number;
  /** World-space enemy angle relative to crosshair (degrees). */
  enemyYawDelta: number;
  enemyPitchDelta: number;
  enemyVisible: boolean;
  playerFiring: boolean;
}

export interface CvPipelineMetrics {
  tMs: number;
  captureLagMs: number;
  inferenceMs: number;
  roiWidth: number;
  roiHeight: number;
  fps: number;
  targetDetected: boolean;
  targetOffsetX: number;
  targetOffsetY: number;
}

export interface ExtractedFeatures {
  /** Mean stick compensation on RY while firing (Cronus AR signal). */
  recoilCompensationMean: number;
  recoilCompensationStd: number;
  /** Autocorrelation peak at polar-AA period (~20ms at speed 18). */
  polarPeriodicity: number;
  /** Max angular velocity deg/s (aimbot snap). */
  maxAngularVelocity: number;
  /** Tracking smoothness 0-1 (high = robotic CV tracking). */
  trackingSmoothness: number;
  /** Shots aligned with enemy before LOS (info cheat proxy). */
  preAimScore: number;
  /** Stick correction lag vs enemy visibility (CV bot proxy). */
  cvLagMs: number;
  /** Binary trigger values (hair trigger). */
  hairTriggerRatio: number;
}

export interface DetectionResult {
  cheatClass: CheatClass | 'unknown';
  confidence: number;
  scores: Record<string, number>;
  features: ExtractedFeatures;
}

export interface CronusSimConfig {
  antiRecoil: boolean;
  polarAa: boolean;
  hairTrigger: boolean;
  arVertical: number;
  arHorizontal: number;
  aaRadius: number;
  aaSpeed: number;
  vmSpeed: number;
}

export interface CvAimbotSimConfig {
  lagMs: number;
  roiSize: number;
  snapThresholdDeg: number;
  smoothing: number;
  captureLagMs: number;
  inferenceMs: number;
}
