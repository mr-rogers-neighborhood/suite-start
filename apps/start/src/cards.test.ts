import type { SuiteAppManifest } from "@suite/contracts";
import { describe, expect, it } from "vitest";
import { appCards, attentionCount, fileCards } from "./cards.js";
import type { CatalogRead } from "./catalog.js";
import type { IndexedFile } from "./fileIndex.js";
import type { DiscoveredApp } from "./registry.js";

function discovered(overrides: Partial<SuiteAppManifest> = {}): DiscoveredApp {
  return {
    manifest: {
      format: "suite.app",
      id: "canvas",
      name: "Suite Canvas",
      version: "0.1.0",
      contractVersion: "1.0.0",
      deepLinkPrefix: "suite://canvas/",
      fileExtensions: ["canvas"],
      protocols: [],
      capabilities: ["document.file"],
      ...overrides,
    },
    manifestPath: "/installs/canvas/suite.app.json",
    executable: "/opt/suite/canvas",
    installedAt: null,
  };
}

function indexed(overrides: Partial<IndexedFile> = {}): IndexedFile {
  return {
    path: "/home/me/Documents/Suite/Canvas/Research.canvas",
    name: "Research.canvas",
    appId: "canvas",
    appName: "Canvas",
    folder: "Canvas",
    modifiedAt: 1_000,
    installed: true,
    ...overrides,
  };
}

const NONE = { state: "none" } as const;

describe("appCards", () => {
  it("counts the files the index found for the app", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [indexed(), indexed({ name: "B.canvas" }), indexed({ appId: "budget" })],
      recents: [],
      catalog: NONE,
    });
    expect(card?.fileCount).toBe(2);
    expect(card?.health).toEqual({ ok: true });
  });

  it("takes the channel from the manifest and the update state from the catalog", () => {
    const catalog: CatalogRead = {
      state: "configured",
      path: "/catalog.json",
      catalog: {
        format: "suite.release.catalog",
        formatVersion: 1,
        generatedAt: "2026-11-05T09:00:00.000Z",
        signature: "unsigned",
        entries: [{ app: "canvas", version: "0.2.0", channel: "beta" }],
      },
    };

    const [card] = appCards({
      apps: [discovered({ update: { feed: "https://example.test/feed", channel: "beta" } })],
      rejected: [],
      files: [],
      recents: [],
      catalog,
    });
    expect(card).toMatchObject({ channel: "beta", update: "update-available" });
  });

  it("leaves the update state unknown when no catalog is configured", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [],
      catalog: NONE,
    });
    expect(card?.update).toBe("unknown");
  });

  it("carries the last-open time from Start's own history", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [{ path: "/a.canvas", appId: "canvas", openedAt: 1_700_000_000_000 }],
      catalog: NONE,
    });
    expect(card?.lastOpenedAt).toBe(1_700_000_000_000);
  });

  it("turns a refused install into a card that says why", () => {
    const cards = appCards({
      apps: [discovered()],
      rejected: [
        { path: "/installs/budget/suite.app.json", reason: "the manifest is not JSON" },
        { path: "/opt/canvas/suite.app.json", reason: "gone", id: "canvas" },
      ],
      files: [],
      recents: [],
      catalog: NONE,
    });

    expect(cards).toHaveLength(3);
    expect(cards[1]).toMatchObject({
      id: null,
      name: "budget",
      executable: null,
      health: { ok: false, reason: "the manifest is not JSON" },
    });
    // A refused install with a record keeps its id, so it can still be removed.
    expect(cards[2]).toMatchObject({ id: "canvas", name: "canvas" });
  });

  it("counts only the cards that need attention", () => {
    const cards = appCards({
      apps: [discovered(), discovered({ id: "planner" })],
      rejected: [{ path: "/installs/budget/suite.app.json", reason: "the manifest is not JSON" }],
      files: [],
      recents: [],
      catalog: NONE,
    });
    expect(attentionCount(cards)).toBe(1);
    expect(attentionCount([])).toBe(0);
  });
});

describe("fileCards", () => {
  it("gives every row the link that opens it", () => {
    const rows = fileCards([indexed()]);
    expect(rows[0]).toMatchObject({
      name: "Research.canvas",
      appId: "canvas",
      link: "suite://canvas/workspace/Research.canvas",
    });
  });

  it("leaves a row without a link when its name would not survive one", () => {
    const rows = fileCards([indexed({ name: "a/b.canvas" })]);
    expect(rows[0]?.link).toBeNull();
  });
});
