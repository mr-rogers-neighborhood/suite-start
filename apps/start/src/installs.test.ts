import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { REGISTRY_FILENAME, registryStore } from "./installs.js";

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "suite-installs-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("registryStore", () => {
  it("answers an empty list before anything is added", async () => {
    expect(await registryStore(directory).list()).toEqual([]);
  });

  it("round-trips a record", async () => {
    const registry = registryStore(directory);
    await registry.add({ id: "canvas", executable: "/opt/suite/canvas" });
    expect(await registry.list()).toEqual([{ id: "canvas", executable: "/opt/suite/canvas" }]);
  });

  it("keeps the manifest path when it is absolute", async () => {
    const registry = registryStore(directory);
    await registry.add({
      id: "canvas",
      executable: "/opt/suite/canvas",
      manifestPath: "/opt/suite/suite.app.json",
    });
    expect((await registry.list())[0]?.manifestPath).toBe("/opt/suite/suite.app.json");
  });

  it("refuses to write a relative executable", async () => {
    await expect(
      registryStore(directory).add({ id: "canvas", executable: "canvas" }),
    ).rejects.toThrow(/absolute executable/u);
  });

  it("refuses to read one that arrived from somewhere else", async () => {
    // A record is still a path this process would spawn, so a bad one is dropped
    // on read rather than trusted because it was written by something else.
    await writeFile(
      join(directory, REGISTRY_FILENAME),
      JSON.stringify({ apps: [{ id: "canvas", executable: "relative/canvas" }] }),
    );
    expect(await registryStore(directory).list()).toEqual([]);
  });

  it("replaces a record with the same id rather than duplicating it", async () => {
    const registry = registryStore(directory);
    await registry.add({ id: "canvas", executable: "/opt/one/canvas" });
    await registry.add({ id: "canvas", executable: "/opt/two/canvas" });
    const list = await registry.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.executable).toBe("/opt/two/canvas");
  });

  it("removes one app and leaves the others", async () => {
    const registry = registryStore(directory);
    await registry.add({ id: "canvas", executable: "/opt/canvas" });
    await registry.add({ id: "budget", executable: "/opt/budget" });
    await registry.remove("canvas");
    expect((await registry.list()).map((record) => record.id)).toEqual(["budget"]);
  });

  it("treats an unreadable file as empty", async () => {
    await writeFile(join(directory, REGISTRY_FILENAME), "{ nope");
    expect(await registryStore(directory).list()).toEqual([]);
  });
});
