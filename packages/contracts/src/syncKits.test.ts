import { describe, expect, it } from "vitest";
import { mergeKitReports, parseSyncKits, syncKitsReportPath } from "./syncKits";

const row = {
  workspaceId: "a".repeat(64),
  deviceId: "b".repeat(64),
  state: "made" as const,
  sealed: true,
  at: "2026-11-06T12:00:00.000Z",
};

describe("what an app says about its way back in", () => {
  it("parses a report, and defaults a missing passphrase flag to plain", () => {
    const parsed = parseSyncKits({
      format: "suite.sync-kits",
      updatedAt: "2026-11-06T12:00:00.000Z",
      kits: [{ ...row, sealed: undefined }],
    });
    expect(parsed.ok && parsed.value.kits[0]?.sealed).toBe(false);
  });

  it("lets the newest report win per workspace and device", () => {
    // A device that declined and later saved a file reads as having one.
    const merged = mergeKitReports(
      [{ ...row, state: "declined", sealed: false, at: "2026-11-06T12:00:00.000Z" }],
      [{ ...row, at: "2026-11-07T12:00:00.000Z" }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.state).toBe("made");
  });

  it("keeps rows for different devices apart", () => {
    const merged = mergeKitReports(
      [row],
      [{ ...row, deviceId: "c".repeat(64), state: "declined" }],
    );
    expect(merged).toHaveLength(2);
  });

  it("finds each app's report in that app's own data directory", () => {
    expect(syncKitsReportPath("Canvas", { platform: "linux", home: "/home/me" })).toBe(
      "/home/me/.local/share/suite/canvas/sync-kits.json",
    );
  });
});
