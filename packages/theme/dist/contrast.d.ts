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
export declare const CONTRAST_TEXT = 4.5;
/** Large text: 18.66px bold or 24px regular. */
export declare const CONTRAST_LARGE = 3;
/** Borders, focus rings, icons and other non-text that carries meaning. */
export declare const CONTRAST_UI = 3;
import type { ThemeRole } from "./roles.js";
/** WCAG relative luminance, or null when the colour is not one the eye can be measured against. */
export declare function luminance(colour: string): number | null;
/**
 * The ratio between two colours, from 1 (identical) to 21 (black on white).
 *
 * Null when either side is not a plain hex — an `rgba()`, a `color-mix()`, a gradient. Those
 * are legitimate values for a role and simply cannot be measured, which is different from
 * measuring them and finding them bad.
 */
export declare function contrastRatio(background: string, ink: string): number | null;
/** Whether a colour is one this module can measure, which a test can use to skip a mix. */
export declare function isMeasurable(colour: string): boolean;
/**
 * The role whose value is readable on `colour`, preferring the least surprising answer.
 *
 * Preference order, not highest ratio: a reader expects body text to be `ink`, so the first
 * candidate that clears the floor wins. `surface-strong` is next because an inverted chip is
 * the next most ordinary thing, and `ink-muted` last because it is meant to recede.
 */
export declare const INK_CANDIDATES: readonly ThemeRole[];
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
export declare function pickInk(colour: string, values: Readonly<Partial<Record<ThemeRole, string>>>, floor?: number): InkChoice | null;
//# sourceMappingURL=contrast.d.ts.map