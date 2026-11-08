import type { SuiteTheme } from "../theme.js";
/**
 * The themes that ship inside the package.
 *
 * Order is the order the picker shows, and the first is the default. Suite is first because
 * it is what the apps look like today: a reader who never opens the picker sees no change,
 * which is the only honest way to add a theme system to software people are already using.
 *
 * Presets live in code rather than in a directory on disk for this pass. A preset cannot be
 * corrupted, cannot be half-written, and is the same three themes in every app at every
 * version. Authoring a theme and sharing it across apps is a later pass, and when it lands
 * these become the built-ins that a disk theme can override.
 */
export declare const PRESETS: readonly SuiteTheme[];
/** The id every app falls back to. */
export declare const DEFAULT_THEME_ID = "suite";
/** One preset by id, or null when nothing ships under that name. */
export declare function presetById(id: string): SuiteTheme | null;
/** The default preset, which is never null because the list is not empty. */
export declare function defaultTheme(): SuiteTheme;
//# sourceMappingURL=index.d.ts.map