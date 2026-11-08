import { describe, expect, it } from "vitest";

import {
  DEFAULT_DENSITY,
  DENSITIES,
  DENSITY_SCALE,
  densityVariables,
  TYPE_ROLES,
  TYPE_SCALE,
  typeVariables,
} from "./scale.js";

const px = (value: string): number => Number.parseInt(value, 10);

describe("the type scale", () => {
  it("keeps every size that shipped, so adopting it moves no pixel", () => {
    // These are the five values the primitives actually used. A scale that "tidied" them would
    // be a redesign smuggled in with a rename.
    expect(TYPE_ROLES.map((role) => TYPE_SCALE[role].size)).toEqual([
      "11px",
      "12px",
      "13px",
      "15px",
      "34px",
    ]);
  });

  it("never goes below a legible body size", () => {
    expect(px(TYPE_SCALE.body.size)).toBeGreaterThanOrEqual(13);
  });

  it("is ordered, so the names mean something", () => {
    const sizes = TYPE_ROLES.map((role) => px(TYPE_SCALE[role].size));
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });

  it("has a line height that clears its size", () => {
    for (const role of TYPE_ROLES) {
      expect(px(TYPE_SCALE[role].lineHeight)).toBeGreaterThan(px(TYPE_SCALE[role].size));
    }
  });
});

describe("density", () => {
  it("uses the names the mobile contract already publishes", () => {
    // `@suite/go` has ThemeDensity = compact | cozy | comfortable. A fourth name would be a
    // fork with extra steps.
    expect([...DENSITIES]).toEqual(["compact", "cozy", "comfortable"]);
  });

  it("keeps cozy as what the desktop shipped", () => {
    expect(DEFAULT_DENSITY).toBe("cozy");
    // Button md was h-9 (36px) with px-3 (12px); sm was h-8 (32px) with px-2.5 (10px).
    expect(DENSITY_SCALE.cozy.controlHeight).toBe("36px");
    expect(DENSITY_SCALE.cozy.controlHeightSmall).toBe("32px");
    expect(DENSITY_SCALE.cozy.controlPaddingX).toBe("12px");
    expect(DENSITY_SCALE.cozy.controlPaddingXSmall).toBe("10px");
  });

  it("reaches the touch floor at comfortable", () => {
    // SC 2.5.5 asks 44px. This is why the density axis exists.
    expect(px(DENSITY_SCALE.comfortable.controlHeight)).toBeGreaterThanOrEqual(44);
    expect(px(DENSITY_SCALE.comfortable.controlHeightSmall)).toBeGreaterThanOrEqual(40);
  });

  it("increases monotonically, so no step is a surprise", () => {
    const heights = DENSITIES.map((density) => px(DENSITY_SCALE[density].controlHeight));
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });

  it("does not touch type, so it cannot multiply with the system font scale", () => {
    // Density publishes space only. If it ever published a font size, a phone at 1.3 font scale
    // and comfortable density would compound, and nothing has measured that layout.
    const names = Object.keys(densityVariables("comfortable"));
    expect(names.some((name) => name.includes("text") || name.includes("leading"))).toBe(false);
  });

  it("publishes every type step as a size and a line height", () => {
    const names = Object.keys(typeVariables());
    for (const role of TYPE_ROLES) {
      expect(names).toContain(`--text-${role}`);
      expect(names).toContain(`--leading-${role}`);
    }
    expect(names).toHaveLength(TYPE_ROLES.length * 2);
  });
});
