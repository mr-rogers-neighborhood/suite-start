import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyFileAtomic, writeFileAtomic } from "./atomic.js";
import { FileMechanicsError } from "./errors.js";

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "suite-atomic-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("writeFileAtomic", () => {
  it("creates a file that did not exist", async () => {
    const path = join(directory, "workspace.canvas");
    await writeFileAtomic(path, new TextEncoder().encode("hello"));
    expect(await readFile(path, "utf8")).toBe("hello");
  });

  it("replaces the whole file and leaves no temp files behind", async () => {
    const path = join(directory, "workspace.canvas");
    await writeFile(path, "the previous version");
    await writeFileAtomic(path, new TextEncoder().encode("the next version"));
    expect(await readFile(path, "utf8")).toBe("the next version");
    expect(await readdir(directory)).toEqual(["workspace.canvas"]);
  });

  it("leaves the previous file untouched when the write fails", async () => {
    const path = join(directory, "workspace.canvas");
    await writeFile(path, "the previous version");
    const missing = join(directory, "nope", "workspace.canvas");

    await expect(writeFileAtomic(missing, new Uint8Array([1]))).rejects.toBeInstanceOf(
      FileMechanicsError,
    );
    expect(await readFile(path, "utf8")).toBe("the previous version");
  });

  it("writes bytes unchanged", async () => {
    const path = join(directory, "bytes.bin");
    const bytes = new Uint8Array([0, 255, 128, 1]);
    await writeFileAtomic(path, bytes);
    expect(new Uint8Array(await readFile(path))).toEqual(bytes);
  });
});

describe("copyFileAtomic", () => {
  it("copies without disturbing the source", async () => {
    const source = join(directory, "source.canvas");
    const target = join(directory, "target.canvas");
    await writeFile(source, "payload");
    await copyFileAtomic(source, target);
    expect(await readFile(target, "utf8")).toBe("payload");
    expect(await readFile(source, "utf8")).toBe("payload");
    expect((await readdir(directory)).sort()).toEqual(["source.canvas", "target.canvas"]);
  });

  it("reports a missing source as a typed failure", async () => {
    await expect(
      copyFileAtomic(join(directory, "missing.canvas"), join(directory, "target.canvas")),
    ).rejects.toBeInstanceOf(FileMechanicsError);
  });
});
