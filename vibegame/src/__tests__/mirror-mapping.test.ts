import { describe, expect, it } from "vitest";

import type { HandPoint } from "../types";
import { mapHandPointForMirror } from "../utils/math";

describe("mapHandPointForMirror", () => {
  const sourcePoint: HandPoint = {
    id: "h0-tip8",
    xNorm: 0.2,
    yNorm: 0.4,
    vxNorm: 1.6,
    vyNorm: -0.5,
    confidence: 0.9,
  };

  it("keeps coordinates unchanged when mirror is off", () => {
    const mapped = mapHandPointForMirror(sourcePoint, false);

    expect(mapped.xNorm).toBe(sourcePoint.xNorm);
    expect(mapped.vxNorm).toBe(sourcePoint.vxNorm);
    expect(mapped.yNorm).toBe(sourcePoint.yNorm);
  });

  it("inverts x-axis and x-velocity when mirror is on", () => {
    const mapped = mapHandPointForMirror(sourcePoint, true);

    expect(mapped.xNorm).toBeCloseTo(0.8, 6);
    expect(mapped.vxNorm).toBeCloseTo(-1.6, 6);
    expect(mapped.yNorm).toBeCloseTo(0.4, 6);
    expect(mapped.vyNorm).toBeCloseTo(-0.5, 6);
  });
});
