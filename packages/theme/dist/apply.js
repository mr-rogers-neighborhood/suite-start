import { ROLE_ORDER } from "./theme.js";
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
export function cssVariableFor(role) {
    return `--${role}`;
}
/**
 * Every role as a custom property, for one theme in one mode.
 *
 * Returned rather than written, so a caller can decide what to do with it: set it on the
 * root, inline it in a generated stylesheet, or assert on it in a test.
 */
export function cssVariables(theme, mode) {
    const values = theme[mode];
    const out = {};
    for (const role of ROLE_ORDER)
        out[cssVariableFor(role)] = values[role];
    return out;
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
export function applyTheme(theme, mode, target) {
    for (const [name, value] of Object.entries(cssVariables(theme, mode))) {
        target.style.setProperty(name, value);
    }
    if (target.dataset !== undefined) {
        target.dataset.theme = theme.id;
        target.dataset.themeMode = mode;
    }
}
/**
 * The `color-scheme` a mode implies.
 *
 * Chromium uses it for scrollbars, form controls and the default canvas, and getting it
 * wrong is the classic "the page is dark but the scrollbar is white" bug.
 */
export function colorSchemeFor(mode) {
    return mode;
}
//# sourceMappingURL=apply.js.map