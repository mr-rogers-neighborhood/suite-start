import { describe, expect, it } from "vitest";
import { joinPath, suiteApplicationsRoot, suitePaths } from "./paths.js";

const home = "/home/me";

describe("suitePaths", () => {
  it("puts documents where a person looks", () => {
    const paths = suitePaths("Canvas", { platform: "linux", home });
    expect(paths.documents).toBe("/home/me/Documents/Suite/Canvas");
  });

  it("puts installed apps under the applications root, which every app shares", () => {
    const canvas = suitePaths("Canvas", { platform: "linux", home });
    const planner = suitePaths("Planner", { platform: "linux", home });
    expect(canvas.applications).toBe("/home/me/Applications/Suite");
    expect(planner.applications).toBe(canvas.applications);
    // An install is neither a person's work nor machine state.
    expect(canvas.applications.startsWith(canvas.documents)).toBe(false);
    expect(canvas.applications.startsWith(canvas.data)).toBe(false);
  });

  it("keeps machine state out of the documents folder", () => {
    // A lock beside a synced document would carry another machine's process id.
    const paths = suitePaths("Canvas", { platform: "linux", home });
    expect(paths.locks.startsWith(paths.data)).toBe(true);
    expect(paths.locks.startsWith(paths.documents)).toBe(false);
  });

  it("follows each platform's convention for the data directory", () => {
    expect(suitePaths("Planner", { platform: "darwin", home: "/Users/me" }).data).toBe(
      "/Users/me/Library/Application Support/Suite Planner",
    );
    expect(suitePaths("Budget", { platform: "win32", home: "C:\\Users\\me" }).data).toContain(
      "AppData\\Roaming",
    );
  });

  it("honours XDG_DATA_HOME on linux", () => {
    expect(suitePaths("Canvas", { platform: "linux", home, xdgDataHome: "/data" }).data).toBe(
      "/data/suite/canvas",
    );
  });

  it("takes an override, which only a caller can supply", () => {
    const paths = suitePaths("Canvas", {
      platform: "linux",
      home,
      documentsOverride: "/tmp/lib",
      dataOverride: "/tmp/data",
      applicationsOverride: "/tmp/apps",
    });
    expect(paths.documents).toBe("/tmp/lib");
    expect(paths.locks).toBe("/tmp/data/locks");
    expect(paths.applications).toBe("/tmp/apps");
  });

  it("names each app's own folder, so three apps never share one", () => {
    const canvas = suitePaths("Canvas", { platform: "linux", home });
    const planner = suitePaths("Planner", { platform: "linux", home });
    expect(canvas.documents).not.toBe(planner.documents);
    expect(canvas.data).not.toBe(planner.data);
  });
});

describe("suiteApplicationsRoot", () => {
  it("uses one convention on every platform, because there is one decision", () => {
    expect(suiteApplicationsRoot("linux", "/home/me")).toBe("/home/me/Applications/Suite");
    expect(suiteApplicationsRoot("darwin", "/Users/me")).toBe("/Users/me/Applications/Suite");
    expect(suiteApplicationsRoot("win32", "C:\\Users\\me")).toBe(
      "C:\\Users\\me\\Applications\\Suite",
    );
  });

  it("takes an override, and ignores a blank one", () => {
    expect(suiteApplicationsRoot("linux", "/home/me", "/tmp/apps")).toBe("/tmp/apps");
    expect(suiteApplicationsRoot("linux", "/home/me", "   ")).toBe("/home/me/Applications/Suite");
  });
});

describe("joinPath", () => {
  it("joins with the platform's separator and trims the ends", () => {
    expect(joinPath("linux", "/a/", "/b/", "c")).toBe("/a/b/c");
    expect(joinPath("win32", "C:\\a\\", "b")).toBe("C:\\a\\b");
  });

  it("keeps the leading root and drops empty parts", () => {
    expect(joinPath("linux", "/", "a", "")).toBe("/a");
  });
});
