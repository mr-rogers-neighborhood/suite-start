import { describe, expect, it } from "vitest";
import { kitsPathFor, readRecoveryReports, recoveryFor } from "./recovery";

const lookup = { platform: "linux", home: "/home/me" };
const workspaceId = "a".repeat(64);

function reader(files: Record<string, string>) {
  return {
    readText: async (path: string) => files[path] ?? null,
  };
}

function report(kits: unknown[]): string {
  return JSON.stringify({
    format: "suite.sync-kits",
    updatedAt: "2026-11-06T12:00:00.000Z",
    kits,
  });
}

describe("what the hub can say about a way back in", () => {
  it("reads each app's own report", async () => {
    const canvas = kitsPathFor("Canvas", lookup);
    const reports = await readRecoveryReports(
      lookup,
      reader({
        [canvas]: report([
          {
            workspaceId,
            deviceId: "b".repeat(64),
            state: "made",
            sealed: true,
            at: "2026-11-06T12:00:00.000Z",
          },
        ]),
      }),
    );

    expect(recoveryFor(reports, workspaceId)).toBe("made");
  });

  it("is quiet about a workspace nobody has been asked about", async () => {
    const reports = await readRecoveryReports(lookup, reader({}));
    expect(recoveryFor(reports, workspaceId)).toBe("none");
  });

  it("remembers a decline, so the hub can be honest without nagging", async () => {
    const canvas = kitsPathFor("Canvas", lookup);
    const reports = await readRecoveryReports(
      lookup,
      reader({
        [canvas]: report([
          {
            workspaceId,
            deviceId: "b".repeat(64),
            state: "declined",
            sealed: false,
            at: "2026-11-06T12:00:00.000Z",
          },
        ]),
      }),
    );
    expect(recoveryFor(reports, workspaceId)).toBe("declined");
  });

  it("ignores a file that is not a report at all", async () => {
    const canvas = kitsPathFor("Canvas", lookup);
    const reports = await readRecoveryReports(lookup, reader({ [canvas]: "{ this is not json" }));
    expect(reports).toHaveLength(0);
  });

  it("counts one device's file as enough, whatever another device declined", () => {
    const reports = [
      { workspaceId, deviceId: "b".repeat(64), state: "declined" as const, sealed: false, at: "1" },
      { workspaceId, deviceId: "c".repeat(64), state: "made" as const, sealed: false, at: "1" },
    ];
    expect(recoveryFor(reports, workspaceId)).toBe("made");
  });
});
