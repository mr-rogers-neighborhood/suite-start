import { describe, expect, it } from "vitest";
import { appEntryLink, manifestFitsHub, parseAppManifest } from "./appManifest.js";
import { CONTRACT_VERSION } from "./contractVersion.js";
import { describeIssues } from "./parse.js";

const canvasManifest = {
  format: "suite.app",
  id: "canvas",
  name: "Suite Canvas",
  version: "0.1.0-alpha.3",
  deepLinkPrefix: "suite://canvas/",
  fileExtensions: ["canvas"],
  protocols: ["suite-canvas"],
  update: { feed: "https://releases.suite.run/canvas/stable" },
  capabilities: ["document.file", "sync.relay", "attachments"],
};

describe("parseAppManifest", () => {
  it("accepts a real manifest and fills the additive defaults", () => {
    const parsed = parseAppManifest(canvasManifest);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.id).toBe("canvas");
    expect(parsed.value.contractVersion).toBe(CONTRACT_VERSION);
    expect(parsed.value.update?.channel).toBe("stable");
  });

  it("refuses a deep-link prefix that does not belong to the app", () => {
    const parsed = parseAppManifest({ ...canvasManifest, id: "budget" });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(describeIssues(parsed.issues)).toContain("suite://budget/");
  });

  it("refuses a duplicate file extension", () => {
    const parsed = parseAppManifest({
      ...canvasManifest,
      fileExtensions: ["canvas", "canvas"],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(describeIssues(parsed.issues)).toContain("duplicate");
  });

  it("refuses a file extension carrying its own dot", () => {
    expect(parseAppManifest({ ...canvasManifest, fileExtensions: [".canvas"] }).ok).toBe(false);
  });

  it("refuses an unknown capability", () => {
    expect(parseAppManifest({ ...canvasManifest, capabilities: ["telepathy"] }).ok).toBe(false);
  });

  it("refuses an executable path in the manifest", () => {
    // The launcher takes its binary from its own registry; a manifest that names
    // one is the injection this schema exists to prevent.
    expect(parseAppManifest({ ...canvasManifest, exec: "/usr/bin/canvas" }).ok).toBe(false);
  });

  it("refuses a missing name", () => {
    expect(parseAppManifest({ ...canvasManifest, name: "" }).ok).toBe(false);
  });
});

describe("manifestFitsHub", () => {
  it("accepts an app written against the current contract", () => {
    expect(manifestFitsHub({ contractVersion: CONTRACT_VERSION })).toBe(true);
  });

  it("refuses an app written against a newer major", () => {
    expect(manifestFitsHub({ contractVersion: "2.0.0" })).toBe(false);
  });
});

describe("appEntryLink", () => {
  it("is the app's bare prefix", () => {
    expect(appEntryLink({ id: "planner" })).toBe("suite://planner/");
  });
});
