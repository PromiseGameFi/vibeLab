import { describe, expect, it } from "vitest";

import { AdaptiveQuality } from "../core/AdaptiveQuality";

describe("AdaptiveQuality", () => {
  it("downgrades auto level when average frame time is too high", () => {
    const adaptive = new AdaptiveQuality(false);

    const result = adaptive.pushFrameTime(40, "auto", 2001);

    expect(result.changed).toBe(true);
    expect(result.activeLevel).toBe("low");
  });

  it("upgrades auto level after sustained headroom", () => {
    const adaptive = new AdaptiveQuality(true);

    let lastLevel = adaptive.getActiveLevel("auto");
    for (let index = 0; index < 70; index += 1) {
      const now = 1000 + index * 100;
      const result = adaptive.pushFrameTime(14, "auto", now);
      lastLevel = result.activeLevel;
    }

    expect(lastLevel).toBe("high");
  });

  it("does not auto-adjust when manual quality is selected", () => {
    const adaptive = new AdaptiveQuality(false);
    const result = adaptive.pushFrameTime(45, "low", 2500);

    expect(result.changed).toBe(false);
    expect(result.activeLevel).toBe("low");
  });
});
