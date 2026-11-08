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
export {
  applyTheme,
  colorSchemeFor,
  cssVariableFor,
  cssVariables,
  type Paintable,
} from "./apply.js";
export {
  CONTRAST_LARGE,
  CONTRAST_TEXT,
  CONTRAST_UI,
  contrastRatio,
  INK_CANDIDATES,
  type InkChoice,
  isMeasurable,
  luminance,
  pickInk,
} from "./contrast.js";
export {
  DEFAULT_THEME_ID,
  defaultTheme,
  PRESETS,
  presetById,
} from "./presets/index.js";
export {
  CHART_ROLES,
  type ChartRole,
  HUE_ROLES,
  type HueRole,
  isThemeRole,
  MARK_ROLES,
  type MarkRole,
  PAINT_INK,
  PAINT_ROLES,
  type PaintRole,
  REQUIRED_ROLES,
  THEME_ROLES,
  type ThemeRole,
  type ThemeValues,
} from "./roles.js";
export {
  isSuiteTheme,
  isThemeMode,
  ROLE_ORDER,
  SUITE_THEME_FORMAT,
  type SuiteTheme,
  THEME_CONTRACT_VERSION,
  THEME_MODES,
  type ThemeMode,
  valuesFor,
} from "./theme.js";
