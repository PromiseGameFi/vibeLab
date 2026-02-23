import type { HandPoint } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export function clampVelocity(value: number, maxAbs = 3): number {
  return clamp(value, -maxAbs, maxAbs);
}

export function computeSmoothedVelocity(
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
  dtMs: number,
  prevVx: number,
  prevVy: number,
  smoothing = 0.42,
  maxAbs = 3,
): { vx: number; vy: number } {
  const dtSeconds = Math.max(0.001, dtMs / 1000);
  const rawVx = (nextX - prevX) / dtSeconds;
  const rawVy = (nextY - prevY) / dtSeconds;

  const vx = clampVelocity(lerp(prevVx, rawVx, smoothing), maxAbs);
  const vy = clampVelocity(lerp(prevVy, rawVy, smoothing), maxAbs);

  return { vx, vy };
}

export function mapHandPointForMirror(point: HandPoint, mirror: boolean): HandPoint {
  if (!mirror) {
    return point;
  }

  return {
    ...point,
    xNorm: 1 - point.xNorm,
    vxNorm: -point.vxNorm,
  };
}

export function formatFps(frameMs: number): number {
  if (!Number.isFinite(frameMs) || frameMs <= 0) {
    return 0;
  }

  return Math.round(1000 / frameMs);
}
