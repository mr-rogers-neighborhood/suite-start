import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RECENT_LIMIT, recentsFile } from "./recents.js";

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "suite-recents-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("recentsFile", () => {
  it("answers an empty list before anything is opened", async () => {
    expect(await recentsFile(directory).list()).toEqual([]);
  });

  it("keeps the newest first", async () => {
    const recents = recentsFile(directory);
    await recents.remember({ path: "/a.canvas", appId: "canvas" });
    await recents.remember({ path: "/b.canvas", appId: "canvas" });
    expect((await recents.list()).map((entry) => entry.path)).toEqual(["/b.canvas", "/a.canvas"]);
  });

  it("moves a reopened file to the top instead of listing it twice", async () => {
    const recents = recentsFile(directory);
    await recents.remember({ path: "/a.canvas", appId: "canvas" });
    await recents.remember({ path: "/b.canvas", appId: "canvas" });
    await recents.remember({ path: "/a.canvas", appId: "canvas" });
    const list = await recents.list();
    expect(list).toHaveLength(2);
    expect(list[0]?.path).toBe("/a.canvas");
  });

  it("forgets one file and keeps the rest", async () => {
    const recents = recentsFile(directory);
    await recents.remember({ path: "/a.canvas", appId: "canvas" });
    await recents.remember({ path: "/b.canvas", appId: "canvas" });
    await recents.forget("/a.canvas");
    expect((await recents.list()).map((entry) => entry.path)).toEqual(["/b.canvas"]);
  });

  it("caps the list", async () => {
    const recents = recentsFile(directory);
    for (let index = 0; index < RECENT_LIMIT + 5; index += 1) {
      await recents.remember({ path: `/f${index}.canvas`, appId: "canvas" });
    }
    expect((await recents.list()).length).toBe(RECENT_LIMIT);
  });

  it("treats an unreadable file as empty rather than failing to start", async () => {
    await writeFile(join(directory, "recents.json"), "not json");
    expect(await recentsFile(directory).list()).toEqual([]);
  });

  it("drops entries that are not records", async () => {
    await writeFile(
      join(directory, "recents.json"),
      JSON.stringify([{ path: "/a.canvas", appId: "canvas", openedAt: 1 }, { nope: true }, 7]),
    );
    expect(await recentsFile(directory).list()).toHaveLength(1);
  });
});
