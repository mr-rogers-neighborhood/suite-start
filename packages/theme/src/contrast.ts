/**
 * Contrast, measured rather than eyeballed.
 *
 * WCAG 2.x relative luminance and ratio. The floors below are the ones the guidelines name,
 * and they are constants here so a test can cite them and a preset can be failed by them
 * rather than by a reviewer's opinion.
 *
 * Deliberately the WCAG 2 formula and not APCA: 2.2 is the target, the numbers are the ones
 * an auditor will quote back, and a ratio is a thing a person can check with a colour picker.
 * APCA is the better model for large text and is not what "WCAG 2.2" means.
 */

/** Text at body size. The floor every ink-on-paint pair has to clear. */
export const CONTRAST_TEXT = 4.5;

/** Large text: 18.66px bold or 24px regular. */
export const CONTRAST_LARGE = 3;

/** Borders, focus rings, icons and other non-text that carries meaning. */
export const CONTRAST_UI = 3;

import type { ThemeRole } from "./roles.js";

/** A hex colour as `[r, g, b]` in 0–255, or null for anything not measurable. */
function rgb(colour: string): readonly [number, number, number] | null {
  const value = colour.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short !== null) {
    const [, r, g, b] = short;
    if (r === undefined || g === undefined || b === undefined) return null;
    return [
      Number.parseInt(`${r}${r}`, 16),
      Number.parseInt(`${g}${g}`, 16),
      Number.parseInt(`${b}${b}`, 16),
    ];
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (long !== null) {
    const [, r, g, b] = long;
    if (r === undefined || g === undefined || b === undefined) return null;
    return [Number.parseInt(r, 16), Number.parseInt(g, 16), Number.parseInt(b, 16)];
  }
  return null;
}

/** WCAG relative luminance, or null when the colour is not one the eye can be measured against. */
export function luminance(colour: string): number | null {
  const channels = rgb(colour);
  if (channels === null) return null;
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The ratio between two colours, from 1 (identical) to 21 (black on white).
 *
 * Null when either side is not a plain hex — an `rgba()`, a `color-mix()`, a gradient. Those
 * are legitimate values for a role and simply cannot be measured, which is different from
 * measuring them and finding them bad.
 */
export function contrastRatio(background: string, ink: string): number | null {
  const a = luminance(background);
  const b = luminance(ink);
  if (a === null || b === null) return null;
  const [high, low] = a >= b ? [a, b] : [b, a];
  return (high + 0.05) / (low + 0.05);
}

/** Whether a colour is one this module can measure, which a test can use to skip a mix. */
export function isMeasurable(colour: string): boolean {
  return rgb(colour) !== null;
}

/**
 * The role whose value is readable on `colour`, preferring the least surprising answer.
 *
 * Preference order, not highest ratio: a reader expects body text to be `ink`, so the first
 * candidate that clears the floor wins. `surface-strong` is next because an inverted chip is
 * the next most ordinary thing, and `ink-muted` last because it is meant to recede.
 */
export const INK_CANDIDATES: readonly ThemeRole[] = ["ink", "surface-strong", "ink-muted"];

export interface InkChoice {
  readonly ink: ThemeRole;
  readonly ratio: number;
}

/**
 * The ink a colour can carry.
 *
 * Returns the best available even when nothing clears the floor, because a caller that has
 * to paint something should paint the most readable thing it has — and the ratio is in the
 * answer so a test, or a UI, can tell the difference between "fine" and "not".
 */
export function pickInk(
  colour: string,
  values: Readonly<Partial<Record<ThemeRole, string>>>,
  floor: number = CONTRAST_TEXT,
): InkChoice | null {
  let best: InkChoice | null = null;
  for (const candidate of INK_CANDIDATES) {
    const value = values[candidate];
    if (value === undefined) continue;
    const ratio = contrastRatio(colour, value);
    if (ratio === null) continue;
    if (ratio >= floor) return { ink: candidate, ratio };
    if (best === null || ratio > best.ratio) best = { ink: candidate, ratio };
  }
  return best;
}
