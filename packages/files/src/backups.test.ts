import { describe, expect, it } from "vitest";
import { backupFileName, backupStamp, backupTimestamp, planRetention } from "./backups.js";

const base = "workspace.canvas";

function at(iso: string): Date {
  return new Date(iso);
}

describe("backupStamp", () => {
  it("is lexically sortable and has no colons", () => {
    expect(backupStamp(at("2026-11-04T20:00:00.000Z"))).toBe("2026-11-04T20-00-00-000Z");
  });

  it("sorts in the same order as the instants", () => {
    const early = backupStamp(at("2026-11-04T09:00:00.000Z"));
    const late = backupStamp(at("2026-11-04T20:00:00.000Z"));
    expect(early < late).toBe(true);
  });
});

describe("backupFileName", () => {
  it("is the file name plus a stamp", () => {
    expect(backupFileName(base, at("2026-11-04T20:00:00.000Z"))).toBe(
      "workspace.canvas.2026-11-04T20-00-00-000Z.bak",
    );
  });
});

describe("backupTimestamp", () => {
  it("reads back the moment a name records", () => {
    const moment = at("2026-11-04T20:00:00.000Z");
    const name = backupFileName(base, moment);
    expect(backupTimestamp(name, base)).toBe(moment.getTime());
  });

  it("refuses a name for another file", () => {
    expect(backupTimestamp(backupFileName("other.canvas", at("2026-11-04T20:00:00Z")), base)).toBe(
      null,
    );
  });

  it("refuses a name that only looks close", () => {
    expect(backupTimestamp("workspace.canvas.backup.bak", base)).toBeNull();
    expect(backupTimestamp("workspace.canvas.2026-11-04T20-00-00-000Z.txt", base)).toBeNull();
    expect(backupTimestamp("workspace.canvas", base)).toBeNull();
  });
});

describe("planRetention", () => {
  const names = [
    backupFileName(base, at("2026-11-01T08:00:00.000Z")),
    backupFileName(base, at("2026-11-02T08:00:00.000Z")),
    backupFileName(base, at("2026-11-03T08:00:00.000Z")),
    backupFileName(base, at("2026-11-04T08:00:00.000Z")),
    backupFileName(base, at("2026-11-04T20:00:00.000Z")),
  ];

  it("keeps one per day, newest first", () => {
    const plan = planRetention(names, { baseName: base, keepDays: 2 });
    expect(plan.keep).toEqual([
      backupFileName(base, at("2026-11-04T20:00:00.000Z")),
      backupFileName(base, at("2026-11-04T08:00:00.000Z")),
      backupFileName(base, at("2026-11-03T08:00:00.000Z")),
    ]);
    expect(plan.remove).toEqual([
      backupFileName(base, at("2026-11-02T08:00:00.000Z")),
      backupFileName(base, at("2026-11-01T08:00:00.000Z")),
    ]);
  });

  it("keeps every backup of a day it decides to keep", () => {
    const plan = planRetention(names, { baseName: base, keepDays: 1 });
    expect(plan.remove).toHaveLength(3);
    expect(plan.keep).toContain(backupFileName(base, at("2026-11-04T08:00:00.000Z")));
  });

  it("leaves names it does not recognise alone", () => {
    const plan = planRetention([...names, "notes.txt", `${base}.old.bak`], {
      baseName: base,
      keepDays: 1,
    });
    expect(plan.remove).not.toContain("notes.txt");
    expect(plan.remove).not.toContain(`${base}.old.bak`);
  });

  it("removes everything when no day is to be kept", () => {
    const plan = planRetention(names, { baseName: base, keepDays: 0 });
    expect(plan.keep).toEqual([]);
    expect(plan.remove).toHaveLength(names.length);
  });

  it("accepts an empty directory", () => {
    expect(planRetention([], { baseName: base })).toEqual({ keep: [], remove: [] });
  });
});
