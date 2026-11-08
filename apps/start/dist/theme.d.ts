import type { ThemeChoice, ThemeOption, ThemeSource } from "./shared.js";
/**
 * Which preset and which mode the hub draws, and where the answer lives.
 *
 * Two things, deliberately separate: a **preset** is a palette family, and a **mode** is how
 * bright to draw it. "Solarized at night" is not a theme, it is Solarized with dark values —
 * so the stored record is a pair, and the picker is a list and a toggle rather than a list of
 * six entries nobody can scan.
 *
 * Stored under the hub's own data directory rather than the page's storage, because the
 * window may be recreated and the choice should outlive it.
 */
export declare const THEME_SOURCES: readonly ThemeSource[];
export declare function isThemeSource(value: unknown): value is ThemeSource;
/** The preset a stored id names, or the default when it names one this build does not ship. */
export declare function presetFor(id: string | null | undefined): string;
export declare const DEFAULT_THEME_CHOICE: ThemeChoice;
/** The picker's list, from the presets this build ships. */
export declare function themeOptions(): readonly ThemeOption[];
/**
 * Read what was chosen, falling back rather than failing: a bad file is not an error.
 *
 * Field by field, so a record written by an older build that knew only a mode keeps that
 * mode and gains the default preset — the same tolerance the appearance preferences use.
 */
export declare function loadThemeChoice(dataDirectory: string): Promise<ThemeChoice>;
/** Record a choice. A failure to persist is reported to the caller, never swallowed here. */
export declare function saveThemeChoice(dataDirectory: string, choice: ThemeChoice): Promise<void>;
/** Whether a value is a choice this build can apply, for the IPC handler to check. */
export declare function isThemeChoice(value: unknown): value is ThemeChoice;
//# sourceMappingURL=theme.d.ts.map