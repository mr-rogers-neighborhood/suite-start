import { describe, expect, it } from "vitest";
import { joinPath, suitePaths } from "./paths.js";

const home = "/home/me";

describe("suitePaths", () => {
  it("puts documents where a person looks", () => {
    const paths = suitePaths("Canvas", { platform: "linux", home });
    expect(paths.documents).toBe("/home/me/Documents/Suite/Canvas");
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
    });
    expect(paths.documents).toBe("/tmp/lib");
    expect(paths.locks).toBe("/tmp/data/locks");
  });

  it("names each app's own folder, so three apps never share one", () => {
    const canvas = suitePaths("Canvas", { platform: "linux", home });
    const planner = suitePaths("Planner", { platform: "linux", home });
    expect(canvas.documents).not.toBe(planner.documents);
    expect(canvas.data).not.toBe(planner.data);
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
