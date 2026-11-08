import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_THEME_ID, PRESETS } from "@suite/theme";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_CHOICE,
  isThemeChoice,
  isThemeSource,
  loadThemeChoice,
  presetFor,
  saveThemeChoice,
  themeOptions,
} from "./theme.js";

const roots: string[] = [];

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "suite-theme-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("isThemeSource", () => {
  it("accepts the three modes and nothing else", () => {
    expect(isThemeSource("system")).toBe(true);
    expect(isThemeSource("light")).toBe(true);
    expect(isThemeSource("dark")).toBe(true);
    expect(isThemeSource("sepia")).toBe(false);
    expect(isThemeSource(null)).toBe(false);
  });
});

describe("presetFor", () => {
  it("keeps a preset this build ships", () => {
    expect(presetFor("solarized")).toBe("solarized");
  });

  it("falls back for one it does not, rather than drawing nothing", () => {
    // A theme file naming a preset from a newer build is a reason to use the default, not to
    // render an unstyled window.
    expect(presetFor("some-future-theme")).toBe(DEFAULT_THEME_ID);
    expect(presetFor(null)).toBe(DEFAULT_THEME_ID);
  });
});

describe("themeOptions", () => {
  it("offers every preset, in the order the package lists them", () => {
    expect(themeOptions().map((option) => option.id)).toEqual(PRESETS.map((theme) => theme.id));
  });

  it("carries a name for each, because a picker of ids is not a picker", () => {
    for (const option of themeOptions()) expect(option.name.length).toBeGreaterThan(0);
  });
});

describe("loadThemeChoice", () => {
  it("follows the desktop with the default preset until someone says otherwise", async () => {
    expect(await loadThemeChoice(await workspace())).toEqual(DEFAULT_THEME_CHOICE);
  });

  it("answers the default for a file it cannot read", async () => {
    const root = await workspace();
    await writeFile(join(root, "theme.json"), "not json at all");
    expect(await loadThemeChoice(root)).toEqual(DEFAULT_THEME_CHOICE);
  });

  it("keeps a mode written by a build that knew only modes", async () => {
    // The record used to be a bare string. A person who chose dark should not lose it
    // because the file grew a field.
    const root = await workspace();
    await writeFile(join(root, "theme.json"), JSON.stringify({ mode: "dark" }));
    expect(await loadThemeChoice(root)).toEqual({ preset: DEFAULT_THEME_ID, mode: "dark" });
  });

  it("reads back what was written", async () => {
    const root = await workspace();
    await saveThemeChoice(root, { preset: "solarized", mode: "light" });
    expect(await loadThemeChoice(root)).toEqual({ preset: "solarized", mode: "light" });
  });
});

describe("isThemeChoice", () => {
  it("accepts a pair and refuses a bare mode", () => {
    expect(isThemeChoice({ preset: "suite", mode: "system" })).toBe(true);
    expect(isThemeChoice({ preset: "suite", mode: "sepia" })).toBe(false);
    expect(isThemeChoice("dark")).toBe(false);
  });
});
