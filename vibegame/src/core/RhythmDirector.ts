import type { HandPoint } from "../types";
import { clamp, clampVelocity } from "../utils/math";

export type RhythmPattern = "orbit" | "figure8" | "wave" | "bounce" | "spiral";

export interface RhythmState {
  pattern: RhythmPattern;
  patternLabel: string;
  beatPulse: number;
  beatIndex: number;
  bpm: number;
  colorPhase: number;
  splatPoints: HandPoint[];
}

const PATTERN_SEQUENCE: RhythmPattern[] = ["orbit", "figure8", "wave", "spiral", "bounce"];

export class RhythmDirector {
  private readonly bpm: number;
  private readonly beatDurationMs: number;
  private readonly beatsPerPattern = 12;

  private startTimeMs = 0;
  private lastUpdateMs = 0;
  private lastBeatIndex = -1;
  private xNorm = 0.5;
  private yNorm = 0.5;
  private vxNorm = 0;
  private vyNorm = 0;

  constructor(bpm = 110) {
    this.bpm = bpm;
    this.beatDurationMs = 60000 / this.bpm;
  }

  reset(nowMs: number): void {
    this.startTimeMs = nowMs;
    this.lastUpdateMs = nowMs;
    this.lastBeatIndex = -1;
    this.xNorm = 0.5;
    this.yNorm = 0.5;
    this.vxNorm = 0;
    this.vyNorm = 0;
  }

  update(nowMs: number, leadPoint: HandPoint | null): RhythmState {
    if (this.startTimeMs === 0) {
      this.reset(nowMs);
    }

    const elapsedMs = nowMs - this.startTimeMs;
    const elapsedSeconds = elapsedMs / 1000;
    const beatFloat = elapsedMs / this.beatDurationMs;
    const beatIndex = Math.floor(beatFloat);
    const beatPhase = beatFloat - beatIndex;
    const beatPulse = Math.exp(-5.7 * beatPhase);

    const patternIndex = Math.floor(beatIndex / this.beatsPerPattern) % PATTERN_SEQUENCE.length;
    const pattern = PATTERN_SEQUENCE[patternIndex];
    const target = this.samplePattern(pattern, elapsedSeconds, beatFloat);

    // Lightly attract choreography to user movement so it feels playful, not scripted.
    const userInfluence = leadPoint ? 0.22 : 0;
    const mixedX = target.xNorm * (1 - userInfluence) + (leadPoint?.xNorm ?? target.xNorm) * userInfluence;
    const mixedY = target.yNorm * (1 - userInfluence) + (leadPoint?.yNorm ?? target.yNorm) * userInfluence;

    const dtSeconds = Math.max(0.001, (nowMs - this.lastUpdateMs) / 1000);
    this.vxNorm = clampVelocity((mixedX - this.xNorm) / dtSeconds, 3.2);
    this.vyNorm = clampVelocity((mixedY - this.yNorm) / dtSeconds, 3.2);
    this.xNorm = mixedX;
    this.yNorm = mixedY;
    this.lastUpdateMs = nowMs;

    const splatPoints: HandPoint[] = [];

    // Primary performer trail.
    splatPoints.push({
      id: `rhythm-main-${pattern}`,
      xNorm: this.xNorm,
      yNorm: this.yNorm,
      vxNorm: this.vxNorm * (0.8 + beatPulse * 0.55),
      vyNorm: this.vyNorm * (0.8 + beatPulse * 0.55),
      confidence: 1,
    });

    // Echo performer mirrored around center for richer flow.
    splatPoints.push({
      id: `rhythm-echo-${pattern}`,
      xNorm: 1 - this.xNorm,
      yNorm: 1 - this.yNorm,
      vxNorm: -this.vxNorm * 0.9,
      vyNorm: -this.vyNorm * 0.9,
      confidence: 1,
    });

    if (beatIndex !== this.lastBeatIndex) {
      this.lastBeatIndex = beatIndex;
      const angle = (beatIndex % 16) * (Math.PI / 8);

      // Beat accents that add playful rhythmic pops.
      splatPoints.push({
        id: `rhythm-pop-a-${beatIndex}`,
        xNorm: this.xNorm,
        yNorm: this.yNorm,
        vxNorm: this.vxNorm * 1.2 + Math.cos(angle) * 1.55,
        vyNorm: this.vyNorm * 1.2 + Math.sin(angle) * 1.55,
        confidence: 1,
      });

      splatPoints.push({
        id: `rhythm-pop-b-${beatIndex}`,
        xNorm: 1 - this.xNorm,
        yNorm: 1 - this.yNorm,
        vxNorm: -this.vxNorm * 1.2 + Math.cos(angle + Math.PI * 0.5) * 1.35,
        vyNorm: -this.vyNorm * 1.2 + Math.sin(angle + Math.PI * 0.5) * 1.35,
        confidence: 1,
      });
    }

    const colorPhase = (patternIndex / PATTERN_SEQUENCE.length + beatFloat * 0.018) % 1;

    return {
      pattern,
      patternLabel: this.patternLabel(pattern),
      beatPulse,
      beatIndex,
      bpm: this.bpm,
      colorPhase,
      splatPoints,
    };
  }

  private samplePattern(pattern: RhythmPattern, t: number, beatFloat: number): { xNorm: number; yNorm: number } {
    switch (pattern) {
      case "orbit": {
        const radius = 0.23 + 0.045 * Math.sin(beatFloat * Math.PI * 0.5);
        return this.clampTarget(0.5 + radius * Math.cos(t * 1.05), 0.5 + radius * Math.sin(t * 1.22));
      }
      case "figure8": {
        return this.clampTarget(0.5 + 0.31 * Math.sin(t * 1.15), 0.5 + 0.2 * Math.sin(t * 2.3));
      }
      case "wave": {
        return this.clampTarget(
          0.5 + 0.33 * Math.sin(t * 0.92 + Math.sin(t * 0.52) * 0.6),
          0.5 + 0.22 * Math.sin(t * 2.7 + Math.cos(t * 1.35)),
        );
      }
      case "bounce": {
        return this.clampTarget(0.5 + 0.24 * Math.sin(t * 1.75), 0.2 + Math.abs(Math.sin(t * 1.95)) * 0.58);
      }
      case "spiral": {
        const radius = 0.08 + ((beatFloat * 0.06) % 0.26);
        return this.clampTarget(0.5 + radius * Math.cos(t * 1.9), 0.5 + radius * Math.sin(t * 1.9));
      }
      default:
        return this.clampTarget(0.5, 0.5);
    }
  }

  private clampTarget(xNorm: number, yNorm: number): { xNorm: number; yNorm: number } {
    return {
      xNorm: clamp(xNorm, 0.08, 0.92),
      yNorm: clamp(yNorm, 0.1, 0.9),
    };
  }

  private patternLabel(pattern: RhythmPattern): string {
    if (pattern === "figure8") {
      return "Figure-8";
    }

    return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  }
}
