import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { START_CHANGED, START_IPC } from "./shared.js";

/**
 * The preload cannot import the shared constants, so its channel names are
 * spelled out. This is what stops them drifting: a rename fails here rather than
 * at runtime, where the symptom is a launcher button that does nothing.
 */
const here = dirname(fileURLToPath(import.meta.url));
const preload = readFileSync(join(here, "preload", "index.cjs"), "utf8");

describe("the launcher bridge", () => {
  it.each(Object.entries(START_IPC))(
    "names the %s channel exactly as shared.ts does",
    (_name, channel) => {
      expect(preload).toContain(`"${channel}"`);
    },
  );

  it("exposes the one global the page looks for", () => {
    expect(preload).toContain('exposeInMainWorld("suiteStart"');
  });

  it("listens on the channel the main process broadcasts to", () => {
    expect(preload).toContain(`"${START_CHANGED}"`);
  });

  it("does not take a path from the page", () => {
    // Adding an app runs a picker in main, so the page never learns a directory
    // it could point somewhere else.
    expect(preload).not.toMatch(/openPath|writeFile|readFile/u);
  });
});
