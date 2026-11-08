import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseAppManifest } from "@suite/contracts";
import type { FeedArtifact } from "@suite/desktop";
import { afterEach, describe, expect, it } from "vitest";
import { CATALOGUE_APPS, type CatalogueEntry } from "./catalogue.js";
import {
  executableInVersion,
  installApp,
  installedVersions,
  manifestText,
  pruneOtherVersions,
} from "./install.js";
import { registryStore } from "./installs.js";

const planner: CatalogueEntry = CATALOGUE_APPS[1];

const roots: string[] = [];

async function workspace(): Promise<{
  appsRoot: string;
  registry: ReturnType<typeof registryStore>;
}> {
  const root = await mkdtemp(join(tmpdir(), "suite-install-"));
  roots.push(root);
  return {
    appsRoot: join(root, "Applications", "Suite"),
    registry: registryStore(join(root, "data")),
  };
}

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function artifactFor(bytes: Uint8Array): FeedArtifact {
  return {
    path: "suite-planner-0.2.0-x86_64.AppImage",
    sha512: createHash("sha512").update(bytes).digest("base64"),
    size: bytes.byteLength,
  };
}

describe("installApp", () => {
  it("places a verified file, makes it executable and records where it went", async () => {
    const { appsRoot, registry } = await workspace();
    const bytes = bytesOf("a whole app");
    const artifact = artifactFor(bytes);
    const seen: string[] = [];

    const installed = await installApp({
      entry: planner,
      version: "0.2.0",
      artifact,
      feed: "https://example.test/planner",
      appsRoot,
      registry,
      now: () => new Date("2026-11-07T12:00:00.000Z"),
      download: async (url, destination) => {
        seen.push(url);
        await writeFile(destination, bytes);
      },
    });

    expect(seen).toEqual([`https://example.test/planner/${artifact.path}`]);
    expect(installed.executable).toBe(
      join(appsRoot, "Planner", "0.2.0", "suite-planner-0.2.0-x86_64.AppImage"),
    );
    expect(await readFile(installed.executable, "utf8")).toBe("a whole app");
    const mode = (await stat(installed.executable)).mode & 0o777;
    expect(mode & 0o111).toBe(0o111);

    const records = await registry.list();
    expect(records).toEqual([
      {
        id: "planner",
        executable: installed.executable,
        manifestPath: installed.manifestPath,
        installedAt: "2026-11-07T12:00:00.000Z",
      },
    ]);
  });

  it("writes a manifest the contract accepts, describing what was verified", async () => {
    const { appsRoot, registry } = await workspace();
    const bytes = bytesOf("an app");
    const installed = await installApp({
      entry: planner,
      version: "0.2.0",
      artifact: artifactFor(bytes),
      feed: "https://example.test/planner",
      appsRoot,
      registry,
      download: async (_url, destination) => writeFile(destination, bytes),
    });

    const parsed = parseAppManifest(JSON.parse(await readFile(installed.manifestPath, "utf8")));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.id).toBe("planner");
    expect(parsed.value.name).toBe("Suite Planner");
    expect(parsed.value.version).toBe("0.2.0");
    expect(parsed.value.update?.feed).toBe("https://example.test/planner");
    expect(parsed.value.fileExtensions).toEqual(["planner"]);
  });

  it("refuses a download that does not match the fingerprint, and writes nothing", async () => {
    const { appsRoot, registry } = await workspace();

    await expect(
      installApp({
        entry: planner,
        version: "0.2.0",
        artifact: { ...artifactFor(bytesOf("the real one")), sha512: "not the real one" },
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        download: async (_url, destination) => writeFile(destination, bytesOf("something else")),
      }),
    ).rejects.toThrow(/fingerprint/u);

    await expect(readdir(join(appsRoot, "Planner"))).rejects.toThrow();
    expect(await registry.list()).toEqual([]);
  });

  it("writes nothing when the download itself fails", async () => {
    const { appsRoot, registry } = await workspace();

    await expect(
      installApp({
        entry: planner,
        version: "0.2.0",
        artifact: artifactFor(bytesOf("an app")),
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        download: async () => {
          throw new Error("the feed answered 404");
        },
      }),
    ).rejects.toThrow("the feed answered 404");

    await expect(readdir(join(appsRoot, "Planner"))).rejects.toThrow();
    expect(await registry.list()).toEqual([]);
  });

  it("replaces a version already on disk without leaving a copy behind", async () => {
    const { appsRoot, registry } = await workspace();
    const first = bytesOf("version one");
    await installApp({
      entry: planner,
      version: "0.2.0",
      artifact: artifactFor(first),
      feed: "https://example.test/planner",
      appsRoot,
      registry,
      download: async (_url, destination) => writeFile(destination, first),
    });

    const second = bytesOf("version two, from the same release");
    const installed = await installApp({
      entry: planner,
      version: "0.2.0",
      artifact: artifactFor(second),
      feed: "https://example.test/planner",
      appsRoot,
      registry,
      download: async (_url, destination) => writeFile(destination, second),
    });

    expect(await readFile(installed.executable, "utf8")).toBe("version two, from the same release");
    const entries = await readdir(join(appsRoot, "Planner"));
    expect(entries).toEqual(["0.2.0"]);
  });
});

describe("pruneOtherVersions", () => {
  it("keeps the version it replaced, and removes everything older", async () => {
    const { appsRoot } = await workspace();
    const registry = registryStore(join(appsRoot, "..", "data"));
    for (const version of ["0.1.0", "0.2.0", "0.3.0"]) {
      await installApp({
        entry: planner,
        version,
        artifact: artifactFor(bytesOf(version)),
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        download: async (_url, destination) => writeFile(destination, bytesOf(version)),
      });
    }

    await pruneOtherVersions(appsRoot, planner, "0.3.0");

    // One step back is the promise; a version history is not.
    expect(await installedVersions(appsRoot, planner)).toEqual(["0.3.0", "0.2.0"]);
  });

  it("keeps nothing extra when told to retain none", async () => {
    const { appsRoot } = await workspace();
    const registry = registryStore(join(appsRoot, "..", "data"));
    for (const version of ["0.1.0", "0.2.0"]) {
      await installApp({
        entry: planner,
        version,
        artifact: artifactFor(bytesOf(version)),
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        download: async (_url, destination) => writeFile(destination, bytesOf(version)),
      });
    }

    await pruneOtherVersions(appsRoot, planner, "0.2.0", 0);
    expect(await installedVersions(appsRoot, planner)).toEqual(["0.2.0"]);
  });

  it("is the same after a rollback as before it", async () => {
    // A rollback walks back down, and pruning reads the disk rather than a history, so the
    // direction must not matter.
    const { appsRoot } = await workspace();
    const registry = registryStore(join(appsRoot, "..", "data"));
    for (const version of ["0.1.0", "0.2.0"]) {
      await installApp({
        entry: planner,
        version,
        artifact: artifactFor(bytesOf(version)),
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        download: async (_url, destination) => writeFile(destination, bytesOf(version)),
      });
    }

    await pruneOtherVersions(appsRoot, planner, "0.1.0");

    expect(await installedVersions(appsRoot, planner)).toEqual(["0.2.0", "0.1.0"]);
  });

  it("is what an update asks for, and a first install does not", async () => {
    const { appsRoot } = await workspace();
    const registry = registryStore(join(appsRoot, "..", "data"));
    for (const version of ["0.1.0", "0.2.0"]) {
      await installApp({
        entry: planner,
        version,
        artifact: artifactFor(bytesOf(version)),
        feed: "https://example.test/planner",
        appsRoot,
        registry,
        prune: true,
        download: async (_url, destination) => writeFile(destination, bytesOf(version)),
      });
    }

    // The second install kept the first as the way back, and the record names the new one.
    expect(await installedVersions(appsRoot, planner)).toEqual(["0.2.0", "0.1.0"]);
    expect((await registry.list())[0]?.executable).toContain("0.2.0");
  });
});

describe("executableInVersion", () => {
  it("finds the artifact beside a kept version, not the manifest", async () => {
    const { appsRoot } = await workspace();
    const kept = bytesOf("kept for a rollback");
    await installApp({
      entry: planner,
      version: "0.2.0",
      artifact: artifactFor(kept),
      feed: "https://example.test/planner",
      appsRoot,
      registry: registryStore(join(appsRoot, "..", "data")),
      download: async (_url, destination) => writeFile(destination, kept),
    });

    const executable = await executableInVersion(appsRoot, planner, "0.2.0");

    expect(executable).toBe(
      join(appsRoot, "Planner", "0.2.0", "suite-planner-0.2.0-x86_64.AppImage"),
    );
  });

  it("answers null for a version that is not on disk", async () => {
    const { appsRoot } = await workspace();
    expect(await executableInVersion(appsRoot, planner, "9.9.9")).toBeNull();
  });
});

describe("installedVersions", () => {
  it("reads what is on disk, newest first", async () => {
    const { appsRoot } = await workspace();
    for (const version of ["0.1.0", "0.10.0", "0.2.0"]) {
      await installApp({
        entry: planner,
        version,
        artifact: artifactFor(bytesOf(version)),
        feed: "https://example.test/planner",
        appsRoot,
        registry: registryStore(join(appsRoot, "..", "data")),
        download: async (_url, destination) => writeFile(destination, bytesOf(version)),
      });
    }

    expect(await installedVersions(appsRoot, planner)).toEqual(["0.10.0", "0.2.0", "0.1.0"]);
  });

  it("never offers a replacement in progress as a version", async () => {
    const { appsRoot } = await workspace();
    await installApp({
      entry: planner,
      version: "0.2.0",
      artifact: artifactFor(bytesOf("an app")),
      feed: "https://example.test/planner",
      appsRoot,
      registry: registryStore(join(appsRoot, "..", "data")),
      download: async (_url, destination) => writeFile(destination, bytesOf("an app")),
    });
    await mkdir(join(appsRoot, "Planner", ".0.1.0.replacing"), { recursive: true });

    expect(await installedVersions(appsRoot, planner)).toEqual(["0.2.0"]);
  });

  it("is empty for an app that was never installed here", async () => {
    const { appsRoot } = await workspace();
    expect(await installedVersions(appsRoot, planner)).toEqual([]);
  });
});

describe("manifestText", () => {
  it("says what the contract requires and nothing it invents", () => {
    const parsed = parseAppManifest(
      JSON.parse(manifestText(planner, "0.2.0", "https://example.test/planner")),
    );
    expect(parsed.ok).toBe(true);
  });
});
