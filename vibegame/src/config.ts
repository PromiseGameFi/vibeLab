import type { AppConfig, QualityLevel, QualityPreset } from "./types";

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    simResolution: 64,
    dyeResolution: 256,
    pressureIterations: 10,
    handTrackingHz: 12,
  },
  medium: {
    simResolution: 96,
    dyeResolution: 384,
    pressureIterations: 14,
    handTrackingHz: 18,
  },
  high: {
    simResolution: 128,
    dyeResolution: 512,
    pressureIterations: 18,
    handTrackingHz: 24,
  },
};

export const DEFAULT_CONFIG: AppConfig = {
  mirror: true,
  quality: "auto",
  showDebug: false,
  theme: "reference-neon",
};

export const DEFAULT_AUTO_LEVEL_DESKTOP: QualityLevel = "medium";
export const DEFAULT_AUTO_LEVEL_MOBILE: QualityLevel = "medium";

export const FLUID_SETTINGS = {
  velocityDissipation: 0.985,
  densityDissipation: 0.992,
  curlStrength: 34,
  splatRadius: 0.0038,
  splatForce: 9.5,
};
