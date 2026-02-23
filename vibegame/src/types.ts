import type * as THREE from "three";

export type QualityMode = "auto" | "low" | "medium" | "high";
export type QualityLevel = Exclude<QualityMode, "auto">;

export interface AppConfig {
  mirror: boolean;
  quality: QualityMode;
  showDebug: boolean;
  theme: "reference-neon";
}

export interface FramePacket {
  videoTimeMs: number;
  videoWidth: number;
  videoHeight: number;
}

export interface HandPoint {
  id: string;
  xNorm: number;
  yNorm: number;
  vxNorm: number;
  vyNorm: number;
  confidence: number;
}

export interface QualityPreset {
  simResolution: number;
  dyeResolution: number;
  pressureIterations: number;
  handTrackingHz: number;
}

export interface CompositorRenderInput {
  fluidTex: THREE.Texture;
  videoTex: THREE.Texture;
  mirror: boolean;
  beatPulse: number;
  colorPhase: number;
}

export interface FluidEngineContract {
  init(): void;
  resize(width: number, height: number): void;
  step(dt: number): void;
  splat(points: HandPoint[]): void;
  getDensityTexture(): WebGLTexture | null;
  reset(): void;
}

export interface VisionPipelineContract {
  init(videoEl: HTMLVideoElement): Promise<void>;
  update(videoTimeMs: number): Promise<void>;
  getHandPoints(): HandPoint[];
  dispose(): void;
}

export interface CompositorContract {
  init(canvas: HTMLCanvasElement): void;
  render(input: CompositorRenderInput): void;
  resize(width: number, height: number): void;
  dispose(): void;
}
