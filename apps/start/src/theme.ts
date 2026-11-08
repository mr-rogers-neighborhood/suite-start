import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
export const THEME_SOURCES: readonly ThemeSource[] = ["system", "light", "dark"];

export const DEFAULT_THEME: ThemeSource = "system";

const THEME_FILENAME = "theme.json";

export function isThemeSource(value: unknown): value is ThemeSource {
  return typeof value === "string" && (THEME_SOURCES as readonly string[]).includes(value);
}

/** Read what was chosen, falling back rather than failing: a bad file is not an error. */
export async function loadTheme(dataDirectory: string): Promise<ThemeSource> {
  try {
    const raw = JSON.parse(await readFile(join(dataDirectory, THEME_FILENAME), "utf8")) as {
      theme?: unknown;
    };
    return isThemeSource(raw.theme) ? raw.theme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Record a choice. A failure to persist is reported to the caller, never swallowed here. */
export async function saveTheme(dataDirectory: string, theme: ThemeSource): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const path = join(dataDirectory, THEME_FILENAME);
  // Through a temporary file: a half-written preference is not a preference, and the
  // previous one is better than a truncated one.
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ theme }, null, 2)}\n`);
  await rename(temporary, path);
}
