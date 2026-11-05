import { describe, expect, it } from "vitest";
import { catalogState, findReleaseEntry, parseReleaseCatalog } from "./release.js";

const catalog = {
  format: "suite.release.catalog",
  formatVersion: 1,
  generatedAt: "2026-11-05T09:00:00.000Z",
  signature: "not-verified-by-this-build",
  entries: [
    { app: "canvas", version: "0.2.0", channel: "stable" },
    { app: "canvas", version: "0.3.0-beta.1", channel: "beta" },
    { app: "planner", version: "0.1.0" },
  ],
};

describe("the release catalog", () => {
  it("parses a catalog and defaults an entry's channel to stable", () => {
    const parsed = parseReleaseCatalog(catalog);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.entries).toHaveLength(3);
    expect(parsed.value.entries[2]?.channel).toBe("stable");
  });

  it("carries a signature without checking it", () => {
    const parsed = parseReleaseCatalog(catalog);
    expect(parsed.ok && parsed.value.signature).toBe("not-verified-by-this-build");
  });

  it.each([
    ["a missing signature", { ...catalog, signature: undefined }, "signature"],
    ["an empty signature", { ...catalog, signature: "" }, "signature"],
    ["a missing format", { ...catalog, format: "suite.release" }, "format"],
    ["a bad version", { ...catalog, entries: [{ app: "canvas", version: "soon" }] }, "version"],
    ["an unknown app id", { ...catalog, entries: [{ app: "Canvas", version: "1.0.0" }] }, "app"],
    [
      "the same app twice on one channel",
      {
        ...catalog,
        entries: [
          { app: "canvas", version: "0.2.0", channel: "stable" },
          { app: "canvas", version: "0.1.0", channel: "stable" },
        ],
      },
      "entries",
    ],
    [
      "an artifact without a hash",
      {
        ...catalog,
        entries: [{ app: "canvas", version: "0.2.0", artifact: { url: "https://example.test/a" } }],
      },
      "artifact",
    ],
  ])("refuses %s, naming the field", (_label, value, field) => {
    const parsed = parseReleaseCatalog(value);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.path.includes(field))).toBe(true);
  });
});

describe("findReleaseEntry", () => {
  it("answers the newest entry on the named channel", () => {
    const parsed = parseReleaseCatalog(catalog);
    if (!parsed.ok) throw new Error("fixture did not parse");
    expect(findReleaseEntry(parsed.value, "canvas", "stable")?.version).toBe("0.2.0");
    expect(findReleaseEntry(parsed.value, "canvas", "beta")?.version).toBe("0.3.0-beta.1");
  });

  it("answers the newest entry across channels when none is named", () => {
    const parsed = parseReleaseCatalog(catalog);
    if (!parsed.ok) throw new Error("fixture did not parse");
    expect(findReleaseEntry(parsed.value, "canvas")?.version).toBe("0.3.0-beta.1");
  });

  it("answers null for an app the catalog does not list", () => {
    const parsed = parseReleaseCatalog(catalog);
    if (!parsed.ok) throw new Error("fixture did not parse");
    expect(findReleaseEntry(parsed.value, "budget")).toBeNull();
    expect(findReleaseEntry(parsed.value, "planner", "beta")).toBeNull();
  });
});

describe("catalogState", () => {
  it("marks a newer release as available", () => {
    expect(catalogState({ version: "0.2.0" }, "0.1.0")).toBe("update-available");
  });

  it("treats the installed version and anything older as current", () => {
    expect(catalogState({ version: "0.1.0" }, "0.1.0")).toBe("up-to-date");
    expect(catalogState({ version: "0.0.9" }, "0.1.0")).toBe("up-to-date");
  });

  it("orders a prerelease below its release", () => {
    expect(catalogState({ version: "1.0.0" }, "1.0.0-beta.2")).toBe("update-available");
    expect(catalogState({ version: "1.0.0-beta.2" }, "1.0.0")).toBe("up-to-date");
  });

  it("answers unknown when there is no entry at all", () => {
    expect(catalogState(null, "0.1.0")).toBe("unknown");
    expect(catalogState(undefined, "0.1.0")).toBe("unknown");
  });

  it("answers unknown rather than current when a version cannot be read", () => {
    expect(catalogState({ version: "0.2.0" }, "not-a-version")).toBe("unknown");
  });
});
