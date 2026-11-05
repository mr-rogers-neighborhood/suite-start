import { describe, expect, it } from "vitest";
import {
  APP_MANIFEST_FILENAME,
  appById,
  appForExtension,
  type DiscoveredApp,
  discoverApps,
  type InstallRecord,
  type RegistryFileSystem,
} from "./registry.js";

const ROOT = "/installs";

function manifest(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: "suite.app",
    id: "canvas",
    name: "Suite Canvas",
    version: "0.1.0",
    contractVersion: "1.0.0",
    deepLinkPrefix: "suite://canvas/",
    fileExtensions: ["canvas"],
    protocols: ["suite-canvas"],
    capabilities: ["document.file"],
    ...overrides,
  });
}

function file(name: string, contents: string): Record<string, string> {
  return { [`${ROOT}/${name}/${APP_MANIFEST_FILENAME}`]: contents };
}

function fakeFileSystem(
  files: Record<string, string>,
  executables: ReadonlySet<string> = new Set(["/opt/suite/canvas"]),
): RegistryFileSystem {
  return {
    async exists(path: string): Promise<boolean> {
      return executables.has(path);
    },
    async readText(path: string): Promise<string> {
      const contents = files[path];
      if (contents === undefined) throw new Error(`ENOENT ${path}`);
      return contents;
    },
    async listDirectories(path: string): Promise<readonly string[]> {
      const prefix = path.endsWith("/") ? path : `${path}/`;
      const children = new Set<string>();
      for (const key of Object.keys(files)) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        const slash = rest.indexOf("/");
        if (slash > 0) children.add(rest.slice(0, slash));
      }
      if (children.size === 0) throw new Error(`ENOENT ${path}`);
      return [...children];
    },
  };
}

const canvasRecord: InstallRecord = { id: "canvas", executable: "/opt/suite/canvas" };

function discover(files: Record<string, string>, records: readonly InstallRecord[]) {
  return discoverApps({
    roots: [ROOT],
    records,
    fileSystem: fakeFileSystem(files),
  });
}

describe("discoverApps", () => {
  it("pairs a manifest with its install record", async () => {
    const result = await discover(file("canvas", manifest()), [canvasRecord]);
    expect(result.rejected).toEqual([]);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0]?.manifest.id).toBe("canvas");
    expect(result.apps[0]?.executable).toBe("/opt/suite/canvas");
    expect(result.apps[0]?.installedAt).toBeNull();
  });

  it("keeps the install time when the record carries one", async () => {
    const result = await discover(file("canvas", manifest()), [
      { ...canvasRecord, installedAt: "2026-11-04T20:00:00.000Z" },
    ]);
    expect(result.apps[0]?.installedAt).toBe("2026-11-04T20:00:00.000Z");
  });

  it("refuses an app with no install record", async () => {
    const result = await discover(file("canvas", manifest()), []);
    expect(result.apps).toEqual([]);
    expect(result.rejected[0]?.reason).toContain("no install record");
  });

  it("refuses a record that names a relative executable", async () => {
    const result = await discover(file("canvas", manifest()), [
      { id: "canvas", executable: "canvas" },
    ]);
    expect(result.rejected[0]?.reason).toContain("relative executable");
  });

  it("refuses a manifest that is not JSON", async () => {
    const result = await discover(file("canvas", "{ nope"), [canvasRecord]);
    expect(result.rejected[0]?.reason).toContain("not JSON");
  });

  it("refuses a manifest that does not match the schema", async () => {
    const result = await discover(file("canvas", manifest({ name: "" })), [canvasRecord]);
    expect(result.rejected[0]?.reason).toContain("name");
  });

  it("refuses an app that needs a newer contract than this launcher implements", async () => {
    const result = await discover(file("canvas", manifest({ contractVersion: "2.0.0" })), [
      canvasRecord,
    ]);
    expect(result.rejected[0]?.reason).toContain("needs contract 2.0.0");
  });

  it("keeps the first install and reports a duplicate", async () => {
    const files = { ...file("canvas", manifest()), ...file("canvas-copy", manifest()) };
    const result = await discover(files, [canvasRecord]);
    expect(result.apps).toHaveLength(1);
    expect(result.rejected[0]?.reason).toContain("duplicate install of canvas");
  });

  it("ignores a directory with no manifest", async () => {
    const files = { ...file("canvas", manifest()), [`${ROOT}/empty/readme.txt`]: "hi" };
    const result = await discover(files, [canvasRecord]);
    expect(result.rejected).toEqual([]);
  });

  it("ignores a root that does not exist", async () => {
    const result = await discoverApps({
      roots: ["/nowhere"],
      records: [canvasRecord],
      fileSystem: fakeFileSystem({}),
    });
    expect(result).toEqual({ apps: [], rejected: [] });
  });
});

describe("lookups", () => {
  const apps = [
    {
      manifest: { id: "canvas", fileExtensions: ["canvas"] },
      executable: "/opt/canvas",
    },
  ] as unknown as readonly DiscoveredApp[];

  it("finds an app by extension, case-insensitively", () => {
    expect(appForExtension(apps, "CANVAS")?.manifest.id).toBe("canvas");
    expect(appForExtension(apps, "planner")).toBeNull();
  });

  it("finds an app by id", () => {
    expect(appById(apps, "canvas")?.manifest.id).toBe("canvas");
    expect(appById(apps, "budget")).toBeNull();
  });
});

describe("a record that names its own manifest", () => {
  it("is discovered without a root, because a packaged app ships it beside itself", async () => {
    const files = { "/opt/suite-canvas/suite.app.json": manifest() };
    const result = await discoverApps({
      roots: [],
      records: [
        {
          id: "canvas",
          executable: "/opt/suite-canvas/suite-canvas",
          manifestPath: "/opt/suite-canvas/suite.app.json",
        },
      ],
      fileSystem: fakeFileSystem(files, new Set(["/opt/suite-canvas/suite-canvas"])),
    });
    expect(result.rejected).toEqual([]);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0]?.executable).toBe("/opt/suite-canvas/suite-canvas");
  });

  it("is refused when the executable it names is gone", async () => {
    const files = { "/opt/suite-canvas/suite.app.json": manifest() };
    const result = await discoverApps({
      roots: [],
      records: [
        {
          id: "canvas",
          executable: "/opt/suite-canvas/suite-canvas",
          manifestPath: "/opt/suite-canvas/suite.app.json",
        },
      ],
      fileSystem: fakeFileSystem(files, new Set()),
    });
    // Refused rather than listed: a card whose Open button can only fail is
    // worse than a card that says what is missing.
    expect(result.apps).toEqual([]);
    expect(result.rejected[0]).toMatchObject({
      id: "canvas",
      reason: "the executable this install names is not there",
    });
  });

  it("is still checked against the install record it claims", async () => {
    const files = { "/opt/suite-canvas/suite.app.json": manifest() };
    const result = await discoverApps({
      roots: [],
      records: [
        {
          id: "canvas",
          executable: "relative/path",
          manifestPath: "/opt/suite-canvas/suite.app.json",
        },
      ],
      fileSystem: fakeFileSystem(files),
    });
    expect(result.apps).toEqual([]);
    expect(result.rejected[0]?.reason).toContain("relative executable");
  });
});
