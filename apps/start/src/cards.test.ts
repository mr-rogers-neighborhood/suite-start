import type { SuiteAppManifest } from "@suite/contracts";
import { describe, expect, it } from "vitest";
import { appCards, attentionCount, fileCards, selfCard } from "./cards.js";
import type { CatalogueApp } from "./catalogue.js";
import type { IndexedFile } from "./fileIndex.js";
import type { DiscoveredApp } from "./registry.js";
import type { ReportedUpdate } from "./reportedUpdate.js";

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

function offered(overrides: Partial<CatalogueApp> = {}): CatalogueApp {
  return {
    id: "canvas",
    name: "Suite Canvas",
    folder: "Canvas",
    extensions: ["canvas"],
    capabilities: ["document.file"],
    feed: "https://example.test/canvas",
    channel: "alpha",
    available: null,
    reason: null,
    installed: null,
    newer: false,
    artifact: null,
    ...overrides,
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

/** The report an app that has never checked gives. */
const UNREPORTED: ReportedUpdate = {
  state: "unknown",
  version: null,
  available: null,
  checkedAt: null,
  source: null,
};

const NO_UPDATES: ReadonlyMap<string, ReportedUpdate> = new Map();
const NO_VERSIONS: ReadonlyMap<string, number> = new Map();

describe("appCards", () => {
  it("offers a card for an app that is not on this machine at all", () => {
    // The empty window was the thing this replaced, so this is the test that matters.
    const [card] = appCards({
      apps: [],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ available: "0.2.0" })],
      versions: NO_VERSIONS,
    });
    expect(card).toMatchObject({
      id: "canvas",
      name: "Suite Canvas",
      state: "not-installed",
      version: null,
      available: "0.2.0",
      executable: null,
    });
  });

  it("offers nothing when the feed offered nothing, and says why", () => {
    const [card] = appCards({
      apps: [],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ reason: "the manifest is not signed by the publisher" })],
      versions: NO_VERSIONS,
    });
    expect(card?.state).toBe("no-release");
    expect(card?.available).toBeNull();
    expect(card?.reason).toBe("the manifest is not signed by the publisher");
  });

  it("asks for an update when the feed is ahead, and keeps the installed version visible", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ available: "0.2.0", installed: "0.1.0", newer: true })],
      versions: new Map([["canvas", 2]]),
    });
    expect(card).toMatchObject({
      state: "update-available",
      version: "0.1.0",
      available: "0.2.0",
      executable: "/opt/suite/canvas",
      versions: 2,
    });
  });

  it("says up to date when the installed version is the offered one", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ available: "0.1.0", installed: "0.1.0" })],
      versions: NO_VERSIONS,
    });
    expect(card).toMatchObject({ state: "current", version: "0.1.0", available: "0.1.0" });
  });

  it("keeps an installed app the catalogue does not name", () => {
    // D44: a copy built by hand is a first-class app, not a lesser one.
    const [card] = appCards({
      apps: [discovered({ id: "scratch", name: "Scratch", deepLinkPrefix: "suite://scratch/" })],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [],
      versions: NO_VERSIONS,
    });
    expect(card).toMatchObject({
      id: "scratch",
      state: "local",
      version: "0.1.0",
      available: null,
      executable: "/opt/suite/canvas",
    });
  });

  it("counts the files the index found for the app", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [indexed(), indexed({ name: "B.canvas" }), indexed({ appId: "budget" })],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ installed: "0.1.0", available: "0.1.0" })],
      versions: NO_VERSIONS,
    });
    expect(card?.fileCount).toBe(2);
    expect(card?.health).toEqual({ ok: true });
  });

  it("takes the channel from the manifest and the update state from the app", () => {
    const [card] = appCards({
      apps: [discovered({ update: { feed: "https://example.test/feed", channel: "beta" } })],
      rejected: [],
      files: [],
      recents: [],
      updates: new Map([
        [
          "canvas",
          {
            state: "available",
            version: "0.1.0",
            available: "0.2.0",
            checkedAt: "2026-11-06T12:00:00.000Z",
            source: "app",
          },
        ],
      ]),
      catalogue: [offered({ installed: "0.1.0", available: "0.1.0" })],
      versions: NO_VERSIONS,
    });
    expect(card).toMatchObject({ channel: "beta", update: { state: "available" } });
  });

  it("leaves the update state unknown when the app never reported one", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ installed: "0.1.0" })],
      versions: NO_VERSIONS,
    });
    expect(card?.update).toEqual(UNREPORTED);
  });

  it("carries the last-open time from Start's own history", () => {
    const [card] = appCards({
      apps: [discovered()],
      rejected: [],
      files: [],
      recents: [{ path: "/a.canvas", appId: "canvas", openedAt: 1_700_000_000_000 }],
      updates: NO_UPDATES,
      catalogue: [offered({ installed: "0.1.0" })],
      versions: NO_VERSIONS,
    });
    expect(card?.lastOpenedAt).toBe(1_700_000_000_000);
  });

  it("turns a refused install into a card that says why, before the others", () => {
    const cards = appCards({
      apps: [discovered()],
      rejected: [
        { path: "/installs/budget/suite.app.json", reason: "the manifest is not JSON" },
        { path: "/opt/canvas/suite.app.json", reason: "gone", id: "canvas" },
      ],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [offered({ installed: "0.1.0" })],
      versions: NO_VERSIONS,
    });

    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      id: null,
      name: "budget",
      state: "refused",
      executable: null,
      health: { ok: false, reason: "the manifest is not JSON" },
    });
    // A refused install with a record keeps its id, so it can still be removed.
    expect(cards[1]).toMatchObject({ id: "canvas", name: "canvas", state: "refused" });
  });

  it("counts only the cards that need attention", () => {
    const cards = appCards({
      apps: [discovered(), discovered({ id: "planner" })],
      rejected: [{ path: "/installs/budget/suite.app.json", reason: "the manifest is not JSON" }],
      files: [],
      recents: [],
      updates: NO_UPDATES,
      catalogue: [
        offered({ installed: "0.1.0" }),
        offered({ id: "planner", name: "Suite Planner", installed: "0.1.0" }),
      ],
      versions: NO_VERSIONS,
    });
    expect(attentionCount(cards)).toBe(1);
    expect(attentionCount([])).toBe(0);
  });
});

describe("selfCard", () => {
  it("asks for nothing itself, and offers the page where a newer build lives", () => {
    const card = selfCard(
      offered({
        id: "start",
        name: "Suite Start",
        available: "0.3.1",
        feed: "https://x",
        releases: "https://github.com/o/r/releases/latest",
      }),
      "0.3.0",
    );
    expect(card).toMatchObject({
      id: "start",
      state: "update-available",
      version: "0.3.0",
      available: "0.3.1",
      releases: "https://github.com/o/r/releases/latest",
      executable: null,
    });
  });

  it("is up to date when the running version is the published one", () => {
    const card = selfCard(offered({ id: "start", available: "0.3.0" }), "0.3.0");
    expect(card.state).toBe("current");
  });

  it("says when the hub's own feed offered nothing", () => {
    const card = selfCard(offered({ id: "start", reason: "no signature" }), "0.3.0");
    expect(card.state).toBe("no-release");
    expect(card.reason).toBe("no signature");
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
