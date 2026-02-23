import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

import type { HandPoint } from "../types";
import { clamp, computeSmoothedVelocity } from "../utils/math";

const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const HAND_LANDMARKER_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const FINGERTIP_INDICES = [4, 8, 12] as const;

interface TipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timestampMs: number;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private handPoints: HandPoint[] = [];
  private readonly tipStateMap = new Map<string, TipState>();
  private busy = false;

  async init(): Promise<void> {
    if (this.handLandmarker) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(HAND_LANDMARKER_WASM_URL);
    try {
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_LANDMARKER_MODEL_URL,
          delegate: "GPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch {
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_LANDMARKER_MODEL_URL,
          delegate: "CPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }
  }

  update(video: HTMLVideoElement, timestampMs: number): void {
    if (!this.handLandmarker || this.busy) {
      return;
    }

    this.busy = true;
    try {
      const result = this.handLandmarker.detectForVideo(video, timestampMs) as {
        landmarks?: Array<Array<{ x: number; y: number }>>;
        handedness?: Array<Array<{ score?: number }>>;
      };

      this.handPoints = this.extractHandPoints(result, timestampMs);
    } finally {
      this.busy = false;
    }
  }

  getHandPoints(): HandPoint[] {
    return this.handPoints;
  }

  dispose(): void {
    this.tipStateMap.clear();
    this.handPoints = [];
    this.handLandmarker?.close();
    this.handLandmarker = null;
  }

  private extractHandPoints(
    result: {
      landmarks?: Array<Array<{ x: number; y: number }>>;
      handedness?: Array<Array<{ score?: number }>>;
    },
    timestampMs: number,
  ): HandPoint[] {
    const landmarks = result.landmarks ?? [];
    const handedness = result.handedness ?? [];
    const points: HandPoint[] = [];
    const activeIds = new Set<string>();

    for (let handIndex = 0; handIndex < landmarks.length; handIndex += 1) {
      const hand = landmarks[handIndex];
      const confidence = handedness[handIndex]?.[0]?.score ?? 1;

      for (const tipIndex of FINGERTIP_INDICES) {
        const landmark = hand[tipIndex];
        if (!landmark) {
          continue;
        }

        const id = `h${handIndex}-tip${tipIndex}`;
        activeIds.add(id);

        const x = clamp(landmark.x, 0, 1);
        const y = clamp(landmark.y, 0, 1);

        const prev = this.tipStateMap.get(id);

        let vx = 0;
        let vy = 0;

        if (prev) {
          const velocity = computeSmoothedVelocity(
            prev.x,
            prev.y,
            x,
            y,
            timestampMs - prev.timestampMs,
            prev.vx,
            prev.vy,
            0.5,
            4,
          );

          vx = velocity.vx;
          vy = velocity.vy;
        }

        this.tipStateMap.set(id, {
          x,
          y,
          vx,
          vy,
          timestampMs,
        });

        points.push({
          id,
          xNorm: x,
          yNorm: y,
          vxNorm: vx,
          vyNorm: vy,
          confidence,
        });
      }
    }

    for (const key of this.tipStateMap.keys()) {
      if (!activeIds.has(key)) {
        this.tipStateMap.delete(key);
      }
    }

    return points;
  }
}
