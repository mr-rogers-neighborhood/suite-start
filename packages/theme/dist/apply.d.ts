import type { ThemeRole } from "./roles.js";
import type { SuiteTheme, ThemeMode } from "./theme.js";
/**
 * Painting a theme onto a document.
 *
 * Every role becomes a CSS custom property named `--<role>`, so a stylesheet reads
 * `var(--ink)` and never asks which theme is on. That indirection is the whole contract: an
 * app has one stylesheet, and a theme is a set of values for it.
 *
 * Deliberately not React, not Electron, and not a store. The smallest thing that works is a
 * function from (theme, mode) to attributes on an element, and everything else — who chose
 * the theme, where it was remembered — belongs to the app.
 */
/** The custom property one role is published as. */
export declare function cssVariableFor(role: ThemeRole): string;
/**
 * Every role as a custom property, for one theme in one mode.
 *
 * Returned rather than written, so a caller can decide what to do with it: set it on the
 * root, inline it in a generated stylesheet, or assert on it in a test.
 */
export declare function cssVariables(theme: SuiteTheme, mode: ThemeMode): Readonly<Record<string, string>>;
/** Anything that can be painted: a DOM element, or a stub with the same two methods. */
export interface Paintable {
    readonly style: {
        setProperty(name: string, value: string): void;
    };
    readonly dataset?: Record<string, string | undefined>;
}
/**
 * Apply a theme to an element.
 *
 * `data-theme` carries the theme id and `data-theme-mode` the resolved mode, because a
 * stylesheet sometimes needs to know more than the values — a preset with a different feel
 * may want a different shadow or a different border treatment, and that is a rule rather
 * than a colour.
 *
 * The mode is the *resolved* one. "Follow the system" is a choice, not a mode; by the time
 * this is called the app has already asked the OS, so the attribute never says `system` and
 * a stylesheet never has to.
 */
export declare function applyTheme(theme: SuiteTheme, mode: ThemeMode, target: Paintable): void;
/**
 * The `color-scheme` a mode implies.
 *
 * Chromium uses it for scrollbars, form controls and the default canvas, and getting it
 * wrong is the classic "the page is dark but the scrollbar is white" bug.
 */
export declare function colorSchemeFor(mode: ThemeMode): "light" | "dark";
//# sourceMappingURL=apply.d.ts.map