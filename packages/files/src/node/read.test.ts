import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileMechanicsError } from "./errors.js";
import { readFileWithLimit, readTextWithLimit } from "./read.js";

let directory = "";

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "suite-read-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("readFileWithLimit", () => {
  it("reads a file under the ceiling", async () => {
    const path = join(directory, "small.txt");
    await writeFile(path, "hello");
    expect(await readTextWithLimit(path, 1024)).toBe("hello");
  });

  it("refuses a file over the ceiling without reading it", async () => {
    const path = join(directory, "big.txt");
    await writeFile(path, "x".repeat(2048));
    await expect(readFileWithLimit(path, 1024)).rejects.toMatchObject({ code: "too-large" });
  });

  it("refuses a missing file as not-a-file", async () => {
    await expect(readFileWithLimit(join(directory, "nope"), 1024)).rejects.toMatchObject({
      code: "not-a-file",
    });
  });

  it("refuses a directory as not-a-file", async () => {
    const nested = join(directory, "nested");
    await mkdir(nested);
    await expect(readFileWithLimit(nested, 1024)).rejects.toMatchObject({ code: "not-a-file" });
  });

  it("carries the reason as a typed error, not a bare message", async () => {
    const path = join(directory, "big.txt");
    await writeFile(path, "x".repeat(2048));
    const error = await readFileWithLimit(path, 1024).catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(FileMechanicsError);
    expect((error as FileMechanicsError).path).toBe(path);
  });
});
