import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_THEME, isThemeSource, loadTheme, saveTheme } from "./theme.js";

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
  it("accepts the three choices and nothing else", () => {
    expect(isThemeSource("system")).toBe(true);
    expect(isThemeSource("light")).toBe(true);
    expect(isThemeSource("dark")).toBe(true);
    expect(isThemeSource("sepia")).toBe(false);
    expect(isThemeSource(null)).toBe(false);
  });
});

describe("loadTheme", () => {
  it("follows the desktop until a person says otherwise", async () => {
    expect(await loadTheme(await workspace())).toBe(DEFAULT_THEME);
  });

  it("answers the default for a file it cannot read", async () => {
    const root = await workspace();
    await writeFile(join(root, "theme.json"), "not json at all");
    expect(await loadTheme(root)).toBe(DEFAULT_THEME);
  });

  it("answers the default for a value it does not recognise", async () => {
    const root = await workspace();
    await writeFile(join(root, "theme.json"), JSON.stringify({ theme: "sepia" }));
    expect(await loadTheme(root)).toBe(DEFAULT_THEME);
  });
});

describe("saveTheme", () => {
  it("reads back what was written", async () => {
    const root = await workspace();
    await saveTheme(root, "dark");
    expect(await loadTheme(root)).toBe("dark");
    await saveTheme(root, "light");
    expect(await loadTheme(root)).toBe("light");
  });

  it("creates the directory it writes into", async () => {
    const root = await workspace();
    await saveTheme(join(root, "not-there-yet"), "dark");
    expect(await loadTheme(join(root, "not-there-yet"))).toBe("dark");
  });
});
