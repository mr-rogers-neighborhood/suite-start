import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pruneBackups, writeBackup } from "./backups.js";

let directory = "";
let path = "";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "suite-backup-"));
  path = join(directory, "workspace.canvas");
  await writeFile(path, "current");
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("writeBackup", () => {
  it("copies the file beside itself under a stamped name", async () => {
    const backupPath = await writeBackup(path, new Date("2026-11-04T20:00:00.000Z"));
    expect(backupPath).toBe(join(directory, "workspace.canvas.2026-11-04T20-00-00-000Z.bak"));
    expect(await readFile(backupPath, "utf8")).toBe("current");
    expect(await readFile(path, "utf8")).toBe("current");
  });
});

describe("pruneBackups", () => {
  it("keeps the window and removes what falls out of it, and nothing else", async () => {
    await writeFile(path, "v1");
    await writeBackup(path, new Date("2026-11-01T08:00:00.000Z"));
    await writeFile(path, "v2");
    await writeBackup(path, new Date("2026-11-02T08:00:00.000Z"));
    await writeFile(path, "v3");
    await writeBackup(path, new Date("2026-11-03T08:00:00.000Z"));
    await writeFile(join(directory, "notes.txt"), "not ours");

    const result = await pruneBackups(path, { keepDays: 1 });

    expect(result.kept).toEqual(["workspace.canvas.2026-11-03T08-00-00-000Z.bak"]);
    expect(result.removed).toHaveLength(2);
    expect((await readdir(directory)).sort()).toEqual([
      "notes.txt",
      "workspace.canvas",
      "workspace.canvas.2026-11-03T08-00-00-000Z.bak",
    ]);
  });

  it("does nothing when there are no backups", async () => {
    const result = await pruneBackups(path);
    expect(result).toEqual({ kept: [], removed: [] });
  });
});
