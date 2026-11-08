import { CONTRAST_TEXT, contrastRatio, PRESETS, THEME_MODES } from "@suite/theme";
import { describe, expect, it } from "vitest";
import { EDGE, INK, INK_ON, SURFACE } from "./tokens.js";

/**
 * Every primitive's colour pairing, checked against every preset.
 *
 * This is the test that makes "enforced rather than remembered" true. The drift that produced
 * this package was two apps hardcoding the ink on a filled button, and it was only visible when
 * a preset neither app had considered was applied: 2.53:1 and 3.47:1 against a floor of 4.5.
 *
 * The class strings are the source here, because they are what the component renders. A pairing
 * is parsed out of `bg-[var(--x)]` and `text-[var(--y)]`, so a component that stops using a role
 * fails to parse rather than quietly passing.
 */
function roleOf(className: string | undefined): string | null {
  const match = className === undefined ? null : /var\(--([a-z0-9-]+)\)/u.exec(className);
  return match?.[1] ?? null;
}

/** Every pair a primitive can put on screen, as (background class, ink class). */
const PAIRS: readonly { readonly name: string; readonly on: string; readonly ink: string }[] = [
  { name: "Button primary", on: "bg-[var(--accent)]", ink: INK_ON.accent },
  { name: "Button danger", on: "bg-[var(--danger)]", ink: INK_ON.danger },
  { name: "Button secondary", on: SURFACE.base, ink: INK.base },
  { name: "Toast info", on: SURFACE.base, ink: INK.base },
  { name: "Toast error", on: SURFACE.base, ink: INK.danger },
  { name: "Field", on: SURFACE.base, ink: INK.base },
  { name: "Dialog", on: SURFACE.base, ink: INK.base },
  { name: "Launch heading on the page", on: "bg-[var(--canvas)]", ink: INK.base },
];

/** Edges that are a component boundary rather than a divider: SC 1.4.11 asks 3:1. */
const BORDERS: readonly { readonly name: string; readonly on: string; readonly edge: string }[] = [
  { name: "Button secondary edge", on: SURFACE.base, edge: EDGE.strong },
  { name: "Field edge", on: SURFACE.base, edge: EDGE.strong },
];

describe.each(PRESETS.map((theme) => [theme.id, theme] as const))("preset %s", (id, theme) => {
  describe.each(THEME_MODES)("%s mode", (mode) => {
    const values = theme[mode] as Record<string, string>;

    it("every pairing parses to two roles", () => {
      for (const pair of PAIRS) {
        expect(roleOf(pair.on), `${pair.name} bg`).not.toBeNull();
        expect(roleOf(pair.ink), `${pair.name} ink`).not.toBeNull();
      }
    });

    it("text on every primitive is readable", () => {
      for (const pair of PAIRS) {
        const on = roleOf(pair.on);
        const ink = roleOf(pair.ink);
        if (on === null || ink === null) continue;
        const ratio = contrastRatio(values[on] ?? "", values[ink] ?? "");
        expect(
          ratio,
          `${id}/${mode}: ${pair.name} — ${ink} on ${on} is ${ratio?.toFixed(2) ?? "unmeasurable"}`,
        ).toBeGreaterThanOrEqual(CONTRAST_TEXT);
      }
    });

    it("every component edge clears the non-text floor", () => {
      for (const border of BORDERS) {
        const on = roleOf(border.on);
        const edge = roleOf(border.edge);
        if (on === null || edge === null) continue;
        const ratio = contrastRatio(values[on] ?? "", values[edge] ?? "");
        expect(
          ratio,
          `${id}/${mode}: ${border.name} is ${ratio?.toFixed(2) ?? "unmeasurable"}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
