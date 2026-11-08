import { type ThemeRole, type ThemeValues } from "./roles.js";
/**
 * A theme: one palette family, in two modes.
 *
 * The shape is deliberately the one the picker shows — a name, then light and dark — rather
 * than two independent themes. "Solarized at night" and "Solarized at noon" are the same
 * theme with different values; making them separate entries is how a list of three themes
 * becomes a list of six and nobody can find the one they wanted.
 *
 * Every role is required in both modes. A theme that defines `accent` in light and forgets it
 * in dark is not half a theme, it is a bug that only shows up after sunset.
 *
 * No schema library: this package is imported by every app, so it carries no runtime
 * dependencies at all. Presets get compile-time exhaustiveness from `satisfies ThemeValues`,
 * which is stricter than a runtime parse — a missing role becomes a type error rather than a
 * failed assertion nobody runs. The guard below exists for theme files read from disk, where
 * TypeScript cannot help.
 */
export declare const SUITE_THEME_FORMAT = "suite.theme";
/** The contract version, bumped when a role is added or its meaning changes. */
export declare const THEME_CONTRACT_VERSION = 1;
export type ThemeMode = "light" | "dark";
export declare const THEME_MODES: readonly ThemeMode[];
export declare function isThemeMode(value: unknown): value is ThemeMode;
export interface SuiteTheme {
    readonly format: typeof SUITE_THEME_FORMAT;
    readonly contractVersion: number;
    /** A slug: lowercase, no spaces, safe as a file name and as a `data-theme` value. */
    readonly id: string;
    readonly name: string;
    /** One sentence, for the picker. Optional: a preset may simply be called what it is. */
    readonly description?: string | undefined;
    readonly light: ThemeValues;
    readonly dark: ThemeValues;
}
/** Whether a value is a theme this build can apply. */
export declare function isSuiteTheme(value: unknown): value is SuiteTheme;
/** The values one theme carries for one mode, as the record `applyTheme` takes. */
export declare function valuesFor(theme: SuiteTheme, mode: ThemeMode): ThemeValues;
/**
 * Every role, in the order a generated stylesheet should declare it.
 *
 * One order for every theme, so two themes' stylesheets diff cleanly and a missing role is
 * visible as a missing line rather than as a puzzle.
 */
export declare const ROLE_ORDER: readonly ThemeRole[];
//# sourceMappingURL=theme.d.ts.map