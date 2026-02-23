import { describe, expect, it } from "vitest";

import { computeSmoothedVelocity } from "../utils/math";

describe("computeSmoothedVelocity", () => {
  it("smooths raw velocity against previous velocity", () => {
    const velocity = computeSmoothedVelocity(0, 0, 0.1, 0, 100, 0, 0, 0.5, 3);

    expect(velocity.vx).toBeCloseTo(0.5, 6);
    expect(velocity.vy).toBeCloseTo(0, 6);
  });

  it("clamps extreme velocity to maxAbs", () => {
    const velocity = computeSmoothedVelocity(0, 0, 1, 1, 16, 0, 0, 1, 2);

    expect(velocity.vx).toBe(2);
    expect(velocity.vy).toBe(2);
  });

  it("handles tiny dt safely", () => {
    const velocity = computeSmoothedVelocity(0.2, 0.2, 0.21, 0.2, 0, 0, 0, 0.5, 3);

    expect(Number.isFinite(velocity.vx)).toBe(true);
    expect(Number.isFinite(velocity.vy)).toBe(true);
  });
});
