import { describe, expect, it } from "vitest";
import { readReportedUpdate, type UpdateFileSystem, updateStatePath } from "./reportedUpdate.js";

const LOOKUP = { platform: "linux", home: "/home/me" };

function fileSystem(text: string | null, onPath?: (path: string) => void): UpdateFileSystem {
  return {
    async readText(path) {
      onPath?.(path);
      if (text === null) throw new Error("ENOENT");
      return text;
    },
  };
}

function report(
  version: string,
  available: string | null = null,
  checkedAt = "2026-11-06T12:00:00.000Z",
) {
  return JSON.stringify({
    format: "suite.update-state",
    version,
    available,
    checkedAt,
    channel: "stable",
  });
}

describe("updateStatePath", () => {
  it("is in the app's own data directory, where it writes its other state", () => {
    expect(updateStatePath("canvas", LOOKUP)).toBe(
      "/home/me/.local/share/suite/canvas/update-state.json",
    );
  });

  it("is null for an app the suite does not know", () => {
    expect(updateStatePath("spreadsheet", LOOKUP)).toBeNull();
  });
});

describe("readReportedUpdate", () => {
  it("reads what the app reported", async () => {
    const update = await readReportedUpdate("canvas", LOOKUP, fileSystem(report("0.1.0")));
    expect(update).toEqual({
      state: "current",
      version: "0.1.0",
      available: null,
      checkedAt: "2026-11-06T12:00:00.000Z",
    });
  });

  it("says an update is available when the app found a newer one", async () => {
    const update = await readReportedUpdate("canvas", LOOKUP, fileSystem(report("0.1.0", "0.2.0")));
    expect(update.state).toBe("available");
    expect(update.available).toBe("0.2.0");
  });

  it("is unknown when the app has never written a report", async () => {
    expect(await readReportedUpdate("canvas", LOOKUP, fileSystem(null))).toEqual({
      state: "unknown",
      version: null,
      available: null,
      checkedAt: null,
    });
  });

  it("is unknown rather than an error when the file is not JSON", async () => {
    const update = await readReportedUpdate("canvas", LOOKUP, fileSystem("{ nope"));
    expect(update.state).toBe("unknown");
  });

  it("is unknown when the file describes something else", async () => {
    const other = JSON.stringify({ format: "suite.deployment", version: "0.1.0" });
    expect((await readReportedUpdate("canvas", LOOKUP, fileSystem(other))).state).toBe("unknown");
  });

  it("asks the app's own directory and nowhere else", async () => {
    const seen: string[] = [];
    await readReportedUpdate(
      "budget",
      LOOKUP,
      fileSystem(report("0.1.0"), (path) => seen.push(path)),
    );
    expect(seen).toEqual(["/home/me/.local/share/suite/budget/update-state.json"]);
  });
});
