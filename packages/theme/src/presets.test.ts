import { describe, expect, it } from "vitest";
import { CONTRAST_TEXT, CONTRAST_UI, contrastRatio, isMeasurable, pickInk } from "./contrast.js";
import { PRESETS } from "./presets/index.js";
import { PAINT_INK, PAINT_ROLES, THEME_ROLES, type ThemeValues } from "./roles.js";
import { isSuiteTheme, type SuiteTheme, THEME_MODES } from "./theme.js";

/**
 * Every shipped preset, measured.
 *
 * This is the test the whole package exists to make possible. A palette is easy to like and
 * hard to verify: Solarized's own body text is 4.13:1, which is why the preset here is a
 * shade darker than the original. A reviewer cannot see that; a ratio can.
 *
 * The floors are WCAG 2.2 AA:
 *
 * - **4.5:1** for body text on every surface it can sit on.
 * - **3:1** for focus rings, which are non-text but carry meaning (SC 1.4.11).
 * - **1.1:1** for a hairline, which is the one deliberate exception. A divider between rows
 *   is decorative and exempt from SC 1.4.11, and a line strong enough to reach 3:1 stops
 *   being a hairline. It still has to be perceivable, so it gets a number rather than a
 *   shrug — and anything that *is* a component boundary uses `border-strong` instead, which
 *   is held to the real floor. Recorded in ACCESSIBILITY.md.
 */
const CONTRAST_EDGE = 1.1;

/** The surfaces text can sit on. `canvas` is included because cards sit on it. */
const TEXT_SURFACES = ["canvas", "surface", "surface-sunk", "surface-strong"] as const;

function ratioOf(paint: string, ink: string): number {
  const ratio = contrastRatio(paint, ink);
  expect(ratio, `could not measure ${ink} on ${paint}`).not.toBeNull();
  return ratio as number;
}

describe.each(PRESETS.map((theme) => [theme.id, theme] as const))("preset %s", (id, theme) => {
  it("is a valid theme this build can apply", () => {
    expect(isSuiteTheme(theme)).toBe(true);
    expect(theme.id).toBe(id);
  });

  it("defines every role in both modes, and nothing that is not a role", () => {
    for (const mode of THEME_MODES) {
      const values = theme[mode] as Record<string, string>;
      expect(Object.keys(values).sort()).toEqual([...THEME_ROLES].sort());
    }
  });

  describe.each(THEME_MODES)("%s mode", (mode) => {
    const values: ThemeValues = theme[mode];

    it("has readable body text on every surface", () => {
      for (const surface of TEXT_SURFACES) {
        const ratio = ratioOf(values[surface], values.ink);
        expect(
          ratio,
          `${id}/${mode}: ink on ${surface} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_TEXT);
      }
    });

    it("has readable secondary text on the surfaces it is used on", () => {
      for (const surface of ["canvas", "surface"] as const) {
        const ratio = ratioOf(values[surface], values["ink-muted"]);
        expect(
          ratio,
          `${id}/${mode}: ink-muted on ${surface} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_TEXT);
      }
    });

    it("has text that can be read on every filled surface", () => {
      for (const paint of PAINT_ROLES) {
        const ink = PAINT_INK[paint];
        const ratio = ratioOf(values[paint], values[ink]);
        expect(
          ratio,
          `${id}/${mode}: ${ink} on ${paint} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_TEXT);
      }
    });

    it("has a focus ring you can see against the surfaces it appears on", () => {
      for (const surface of TEXT_SURFACES) {
        const ratio = ratioOf(values[surface], values.focus);
        expect(
          ratio,
          `${id}/${mode}: focus against ${surface} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_UI);
      }
    });

    it("has a hairline that is at least perceivable", () => {
      for (const surface of ["canvas", "surface"] as const) {
        const ratio = ratioOf(values[surface], values.hairline);
        expect(
          ratio,
          `${id}/${mode}: hairline on ${surface} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_EDGE);
      }
    });

    it("has a component boundary that clears the non-text floor", () => {
      // The edge of an input, a button or a focusable card. This one SC 1.4.11 applies to.
      for (const surface of TEXT_SURFACES) {
        const ratio = ratioOf(values[surface], values["border-strong"]);
        expect(
          ratio,
          `${id}/${mode}: border-strong on ${surface} is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_UI);
      }
    });

    it("has section hues that read as marks on the page", () => {
      // A section stroke or a card ring is a graphical object: SC 1.4.11 asks for 3:1.
      for (const role of THEME_ROLES.filter((name) => name.startsWith("hue-"))) {
        const ratio = ratioOf(values.surface, values[role]);
        expect(
          ratio,
          `${id}/${mode}: ${role} on surface is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_UI);
      }
    });

    it("has chart series that read as marks on the page", () => {
      for (const role of THEME_ROLES.filter((name) => name.startsWith("chart-"))) {
        const ratio = ratioOf(values.surface, values[role]);
        expect(
          ratio,
          `${id}/${mode}: ${role} on surface is ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(CONTRAST_UI);
      }
    });

    it("can name an ink for every hue it offers", () => {
      // The paint system picks an ink per swatch. If no role can carry text on a hue, a card
      // wearing it has nowhere to put a label.
      for (const role of THEME_ROLES.filter((name) => name.startsWith("hue-"))) {
        const choice = pickInk(values[role], values);
        expect(choice, `${id}/${mode}: no ink for ${role}`).not.toBeNull();
      }
    });
  });
});

describe("preset list", () => {
  it("ships Suite first, because the first preset is what everybody sees", () => {
    expect(PRESETS[0]?.id).toBe("suite");
  });

  it("gives every preset a distinct id", () => {
    const ids = PRESETS.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("measures every value it ships, so no preset hides behind a colour-mix", () => {
    // A role may hold a CSS function; a *preset* may not, or the floors above would be
    // skipped rather than passed.
    for (const theme of PRESETS as readonly SuiteTheme[]) {
      for (const mode of THEME_MODES) {
        for (const role of THEME_ROLES) {
          expect(isMeasurable(theme[mode][role]), `${theme.id}/${mode}/${role}`).toBe(true);
        }
      }
    }
  });
});
