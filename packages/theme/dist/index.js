/**
 * `@suite/theme` — the palette every Suite app shares.
 *
 * Pure data and pure functions: no React, no Electron, no filesystem. An app hands a theme
 * and a mode to `applyTheme` and its stylesheet reads `var(--ink)`; that is the entire
 * integration, and it is why Start (no Tailwind) and Canvas (all Tailwind) can use the same
 * package without either of them changing its build.
 *
 * What lives here and why:
 *
 * - `roles` — the vocabulary. A role is a job, never a colour.
 * - `contrast` — WCAG 2.x measurement and the floors, so "readable" is a test rather than an
 *   opinion. This is the module that stops a hand-written preset from shipping illegible.
 * - `theme` — the schema. Both modes are required, because a theme that forgets dark is a
 *   bug that only appears after sunset.
 * - `presets` — the themes that ship. Suite first, so the default changes nothing.
 * - `apply` — the one function an app calls.
 */
export { applyTheme, colorSchemeFor, cssVariableFor, cssVariables, } from "./apply.js";
export { CONTRAST_LARGE, CONTRAST_TEXT, CONTRAST_UI, contrastRatio, INK_CANDIDATES, isMeasurable, luminance, pickInk, } from "./contrast.js";
export { DEFAULT_THEME_ID, defaultTheme, PRESETS, presetById, } from "./presets/index.js";
export { CHART_ROLES, HUE_ROLES, isThemeRole, MARK_ROLES, PAINT_INK, PAINT_ROLES, REQUIRED_ROLES, THEME_ROLES, } from "./roles.js";
export { applyScale, DEFAULT_DENSITY, DENSITIES, DENSITY_SCALE, densityVariables, TYPE_ROLES, TYPE_SCALE, typeVariableFor, typeVariables, } from "./scale.js";
export { isSuiteTheme, isThemeMode, ROLE_ORDER, SUITE_THEME_FORMAT, THEME_CONTRACT_VERSION, THEME_MODES, valuesFor, } from "./theme.js";
//# sourceMappingURL=index.js.map