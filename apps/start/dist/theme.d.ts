import type { ThemeSource } from "./shared.js";
/**
 * Which palette the hub draws, and where the answer lives.
 *
 * The hub does not own a palette: `prefers-color-scheme` already follows the desktop, and
 * the stylesheet has both sets of custom properties. What it cannot do is disagree with the
 * desktop, which is what this file is for — Electron's `nativeTheme.themeSource` answers the
 * media query for every window, so setting it once covers the page, the title bar and the
 * scrollbars without a second source of colour.
 *
 * Stored under the hub's own data directory rather than the page's storage, because the
 * window may be recreated and the choice should outlive it.
 */
/** What a person can choose. `system` is the default and the honest one. */
export declare const THEME_SOURCES: readonly ThemeSource[];
export declare const DEFAULT_THEME: ThemeSource;
export declare function isThemeSource(value: unknown): value is ThemeSource;
/** Read what was chosen, falling back rather than failing: a bad file is not an error. */
export declare function loadTheme(dataDirectory: string): Promise<ThemeSource>;
/** Record a choice. A failure to persist is reported to the caller, never swallowed here. */
export declare function saveTheme(dataDirectory: string, theme: ThemeSource): Promise<void>;
//# sourceMappingURL=theme.d.ts.map