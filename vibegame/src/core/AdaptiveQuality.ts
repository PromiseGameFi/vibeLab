import {
  DEFAULT_AUTO_LEVEL_DESKTOP,
  DEFAULT_AUTO_LEVEL_MOBILE,
  QUALITY_PRESETS,
} from "../config";
import type { QualityLevel, QualityMode, QualityPreset } from "../types";

export interface QualityChange {
  changed: boolean;
  activeLevel: QualityLevel;
}

export class AdaptiveQuality {
  private readonly frameTimes: number[] = [];
  private autoLevel: QualityLevel;
  private lastChangeAtMs = 0;
  private headroomSinceMs = 0;

  constructor(isMobile: boolean) {
    this.autoLevel = isMobile ? DEFAULT_AUTO_LEVEL_MOBILE : DEFAULT_AUTO_LEVEL_DESKTOP;
  }

  getPreset(requestedQuality: QualityMode): QualityPreset {
    const level = requestedQuality === "auto" ? this.autoLevel : requestedQuality;
    return QUALITY_PRESETS[level];
  }

  getActiveLevel(requestedQuality: QualityMode): QualityLevel {
    return requestedQuality === "auto" ? this.autoLevel : requestedQuality;
  }

  pushFrameTime(frameMs: number, requestedQuality: QualityMode, nowMs = performance.now()): QualityChange {
    if (requestedQuality !== "auto") {
      this.frameTimes.length = 0;
      this.headroomSinceMs = 0;
      return { changed: false, activeLevel: requestedQuality };
    }

    this.frameTimes.push(frameMs);
    if (this.frameTimes.length > 120) {
      this.frameTimes.shift();
    }

    const avgFrameMs = this.frameTimes.reduce((sum, current) => sum + current, 0) / this.frameTimes.length;

    let changed = false;

    if (avgFrameMs > 33 && nowMs - this.lastChangeAtMs > 1800) {
      if (this.autoLevel === "high") {
        this.autoLevel = "medium";
        changed = true;
      } else if (this.autoLevel === "medium") {
        this.autoLevel = "low";
        changed = true;
      }

      if (changed) {
        this.lastChangeAtMs = nowMs;
        this.headroomSinceMs = 0;
      }
    } else if (avgFrameMs < 18) {
      if (this.headroomSinceMs === 0) {
        this.headroomSinceMs = nowMs;
      }

      const stableHeadroom = nowMs - this.headroomSinceMs > 5000;
      if (stableHeadroom && nowMs - this.lastChangeAtMs > 1800) {
        if (this.autoLevel === "low") {
          this.autoLevel = "medium";
          changed = true;
        } else if (this.autoLevel === "medium") {
          this.autoLevel = "high";
          changed = true;
        }

        if (changed) {
          this.lastChangeAtMs = nowMs;
          this.headroomSinceMs = nowMs;
        }
      }
    } else {
      this.headroomSinceMs = 0;
    }

    return { changed, activeLevel: this.autoLevel };
  }
}
