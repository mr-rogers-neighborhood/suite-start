import { describe, expect, it } from "vitest";
import { type CatalogFileSystem, catalogPathFromEnv, readCatalog } from "./catalog.js";

const CATALOG = JSON.stringify({
  format: "suite.release.catalog",
  formatVersion: 1,
  generatedAt: "2026-11-05T09:00:00.000Z",
  signature: "unsigned-in-this-build",
  entries: [{ app: "canvas", version: "0.2.0" }],
});

function fileSystem(text: string | Error): CatalogFileSystem {
  return {
    async readText() {
      if (text instanceof Error) throw text;
      return text;
    },
  };
}

describe("catalogPathFromEnv", () => {
  it("answers null when nothing names a catalog", () => {
    expect(catalogPathFromEnv({})).toBeNull();
    expect(catalogPathFromEnv({ SUITE_START_CATALOG: "" })).toBeNull();
    expect(catalogPathFromEnv({ SUITE_START_CATALOG: "   " })).toBeNull();
  });

  it("answers the path the environment names", () => {
    expect(catalogPathFromEnv({ SUITE_START_CATALOG: "/tmp/catalog.json" })).toBe(
      "/tmp/catalog.json",
    );
  });
});

describe("readCatalog", () => {
  it("reports that no catalog is configured rather than inventing one", async () => {
    expect(await readCatalog(null, fileSystem(CATALOG))).toEqual({ state: "none" });
  });

  it("reads a well-formed catalog", async () => {
    const read = await readCatalog("/catalog.json", fileSystem(CATALOG));
    expect(read.state).toBe("configured");
    if (read.state !== "configured") return;
    expect(read.catalog.entries[0]?.version).toBe("0.2.0");
  });

  it("refuses a malformed catalog by field name", async () => {
    const read = await readCatalog(
      "/catalog.json",
      fileSystem(JSON.stringify({ format: "suite.release.catalog", entries: [] })),
    );
    expect(read.state).toBe("refused");
    if (read.state !== "refused") return;
    expect(read.reason).toContain("formatVersion");
  });

  it("refuses a file that is not JSON, and a file it cannot read", async () => {
    const notJson = await readCatalog("/catalog.json", fileSystem("not json"));
    expect(notJson).toMatchObject({ state: "refused", reason: "the catalog is not JSON" });

    const missing = await readCatalog("/catalog.json", fileSystem(new Error("ENOENT")));
    expect(missing).toMatchObject({
      state: "refused",
      reason: "the catalog file could not be read",
    });
  });
});
