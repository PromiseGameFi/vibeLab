import type { HandPoint, QualityPreset, VisionPipelineContract } from "../types";
import { HandTracker } from "./HandTracker";

export class VisionPipeline implements VisionPipelineContract {
  private readonly handTracker = new HandTracker();

  private videoEl: HTMLVideoElement | null = null;
  private handPoints: HandPoint[] = [];

  private preset: QualityPreset;
  private lastHandUpdateMs = 0;
  private initialized = false;
  private handsReady = false;

  constructor(preset: QualityPreset) {
    this.preset = preset;
  }

  async init(videoEl: HTMLVideoElement): Promise<void> {
    this.videoEl = videoEl;

    const [handInitResult] = await Promise.allSettled([this.handTracker.init()]);

    this.handsReady = handInitResult.status === "fulfilled";

    if (!this.handsReady) {
      throw new Error("Failed to initialize hand tracking model.");
    }

    this.initialized = true;
  }

  async update(videoTimeMs: number): Promise<void> {
    const videoEl = this.videoEl;
    if (!this.initialized || !videoEl) {
      return;
    }

    const tasks: Array<Promise<void>> = [];

    if (this.handsReady && videoTimeMs - this.lastHandUpdateMs >= 1000 / this.preset.handTrackingHz) {
      tasks.push(
        Promise.resolve().then(() => {
          this.handTracker.update(videoEl, videoTimeMs);
          this.handPoints = this.handTracker.getHandPoints();
          this.lastHandUpdateMs = videoTimeMs;
        }),
      );
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }

  setPreset(preset: QualityPreset): void {
    this.preset = preset;
  }

  getHandPoints(): HandPoint[] {
    return this.handPoints;
  }

  isReady(): boolean {
    return this.initialized;
  }

  hasHandTracking(): boolean {
    return this.handsReady;
  }

  dispose(): void {
    this.handTracker.dispose();
    this.videoEl = null;
    this.handPoints = [];
    this.initialized = false;
    this.handsReady = false;
  }
}
