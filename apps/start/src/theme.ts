import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_THEME_ID, PRESETS, presetById } from "@suite/theme";
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

export const THEME_SOURCES: readonly ThemeSource[] = ["system", "light", "dark"];

export function isThemeSource(value: unknown): value is ThemeSource {
  return typeof value === "string" && (THEME_SOURCES as readonly string[]).includes(value);
}

/** The preset a stored id names, or the default when it names one this build does not ship. */
export function presetFor(id: string | null | undefined): string {
  return id !== null && id !== undefined && presetById(id) !== null ? id : DEFAULT_THEME_ID;
}

export const DEFAULT_THEME_CHOICE: ThemeChoice = { preset: DEFAULT_THEME_ID, mode: "system" };

const THEME_FILENAME = "theme.json";

/** The picker's list, from the presets this build ships. */
export function themeOptions(): readonly ThemeOption[] {
  return PRESETS.map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description ?? null,
  }));
}

/**
 * Read what was chosen, falling back rather than failing: a bad file is not an error.
 *
 * Field by field, so a record written by an older build that knew only a mode keeps that
 * mode and gains the default preset — the same tolerance the appearance preferences use.
 */
export async function loadThemeChoice(dataDirectory: string): Promise<ThemeChoice> {
  try {
    const raw = JSON.parse(await readFile(join(dataDirectory, THEME_FILENAME), "utf8")) as {
      preset?: unknown;
      mode?: unknown;
    };
    return {
      preset: presetFor(typeof raw.preset === "string" ? raw.preset : null),
      mode: isThemeSource(raw.mode) ? raw.mode : DEFAULT_THEME_CHOICE.mode,
    };
  } catch {
    return DEFAULT_THEME_CHOICE;
  }
}

/** Record a choice. A failure to persist is reported to the caller, never swallowed here. */
export async function saveThemeChoice(dataDirectory: string, choice: ThemeChoice): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const path = join(dataDirectory, THEME_FILENAME);
  // Through a temporary file: a half-written preference is not a preference, and the
  // previous one is better than a truncated one.
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(choice, null, 2)}\n`);
  await rename(temporary, path);
}

/** Whether a value is a choice this build can apply, for the IPC handler to check. */
export function isThemeChoice(value: unknown): value is ThemeChoice {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.preset === "string" && isThemeSource(record.mode);
}
