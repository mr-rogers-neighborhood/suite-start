/**
 * The names a theme may set, and the ones an app may read.
 *
 * A role is a *job*, never a colour: `ink` is "text on the page", `hairline` is "the edge
 * of a thing that is not interactive". An app says which role a control wears and the theme
 * decides what that resolves to, so a new preset is a new set of values rather than a new
 * vocabulary — and no component ever holds a hex string.
 *
 * `hairline` and `border-strong` are two different jobs and were nearly one. A divider
 * between rows is decorative — WCAG exempts it, and a strong line there is visual noise. The
 * edge of an input or a button is a boundary that carries meaning, so SC 1.4.11 asks for 3:1
 * and the theme has to be able to say that without making every divider heavy.
 *
 * The pairs are the important part. `accent` and `accent-ink` travel together, so a surface
 * that is painted with one cannot end up carrying text the theme never checked. That
 * convention is the one thing worth taking from shadcn: a background without its foreground
 * is how a themed interface ends up unreadable in one mode.
 */

/**
 * Roles that are a paint and may be used as a background.
 *
 * Each has a companion in `PAINT_INK` naming the ink that sits on it, which is what keeps a
 * pair from being assembled wrongly at a call site.
 */
export const PAINT_ROLES = [
  "canvas",
  "surface",
  "surface-sunk",
  "surface-strong",
  "accent",
  "accent-strong",
  "danger",
  "success",
  "warning",
] as const;
export type PaintRole = (typeof PAINT_ROLES)[number];

/** Roles that are only ever a foreground or a line: nothing is painted with them. */
export const MARK_ROLES = [
  "ink",
  "ink-muted",
  "ink-faint",
  "hairline",
  "border-strong",
  "focus",
  "on-accent",
  "on-danger",
  "on-success",
  "on-warning",
] as const;
export type MarkRole = (typeof MARK_ROLES)[number];

/** The six hues a section, a card or a tag can wear. Named by hue, not by meaning. */
export const HUE_ROLES = [
  "hue-slate",
  "hue-blue",
  "hue-green",
  "hue-amber",
  "hue-rose",
  "hue-violet",
] as const;
export type HueRole = (typeof HUE_ROLES)[number];

/** Chart series. One set, so a budget and a canvas draw the same graph the same way. */
export const CHART_ROLES = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;
export type ChartRole = (typeof CHART_ROLES)[number];

export const THEME_ROLES = [...PAINT_ROLES, ...MARK_ROLES, ...HUE_ROLES, ...CHART_ROLES] as const;
export type ThemeRole = (typeof THEME_ROLES)[number];

/**
 * The ink that belongs on each paint.
 *
 * `on-accent` is text on `accent`; there is no `on-surface` because the ink on a page
 * surface is `ink`, which is already a role. Keeping the mapping here means a component asks
 * for `PAINT_INK.accent` rather than remembering which of two roles is the readable one.
 *
 * The four `on-*` roles exist because a filled button is the one place a static mapping
 * cannot work: `accent` is a dark blue in one theme and a light one in another, so the text
 * on it has to be the theme's answer rather than a guess. That is the whole reason a theme
 * defines pairs.
 */
export const PAINT_INK: Readonly<Record<PaintRole, MarkRole>> = {
  canvas: "ink",
  surface: "ink",
  "surface-sunk": "ink",
  "surface-strong": "ink",
  accent: "on-accent",
  "accent-strong": "on-accent",
  danger: "on-danger",
  success: "on-success",
  warning: "on-warning",
};

/** The roles a theme is required to define. A preset missing one is not a theme. */
export const REQUIRED_ROLES: readonly ThemeRole[] = THEME_ROLES;

/** One mode's worth of values, by role. */
export type ThemeValues = Readonly<Record<ThemeRole, string>>;

/** Whether a string names a role. Used by the schema and by anything reading a theme file. */
export function isThemeRole(value: unknown): value is ThemeRole {
  return typeof value === "string" && (THEME_ROLES as readonly string[]).includes(value);
}
