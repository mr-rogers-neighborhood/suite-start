import { describe, expect, it } from "vitest";
import type { DiscoveredApp } from "./registry.js";
import {
  describeRouteRejection,
  extensionOf,
  isRoutablePath,
  routeLaunch,
  spawnCommand,
} from "./route.js";

function app(id: string, extensions: readonly string[]): DiscoveredApp {
  return {
    manifest: {
      format: "suite.app",
      id,
      name: id,
      version: "0.1.0",
      contractVersion: "1.0.0",
      deepLinkPrefix: `suite://${id}/`,
      fileExtensions: [...extensions],
      protocols: [],
      capabilities: [],
    },
    manifestPath: `/installs/${id}/suite.app.json`,
    executable: `/opt/suite/${id}`,
    installedAt: null,
  };
}

const apps = [app("canvas", ["canvas"]), app("budget", ["budget"]), app("start", [])];

describe("extensionOf", () => {
  it("reads the extension of the final name", () => {
    expect(extensionOf("/home/me/Research.canvas")).toBe("canvas");
    expect(extensionOf("C:\\Users\\me\\Research.CANVAS")).toBe("canvas");
  });

  it("answers null when there is none, or it is a dotfile", () => {
    expect(extensionOf("/home/me/README")).toBeNull();
    expect(extensionOf("/home/me/.canvas")).toBeNull();
    expect(extensionOf("/home/me/trailing.")).toBeNull();
  });
});

describe("isRoutablePath", () => {
  it("accepts an absolute path", () => {
    expect(isRoutablePath("/home/me/Research.canvas")).toBe(true);
    expect(isRoutablePath("C:\\Users\\me\\Research.canvas")).toBe(true);
  });

  it("refuses a relative path", () => {
    expect(isRoutablePath("Research.canvas")).toBe(false);
    expect(isRoutablePath("./Research.canvas")).toBe(false);
  });

  it("refuses a path that climbs", () => {
    expect(isRoutablePath("/home/me/../../etc/passwd")).toBe(false);
  });
});

describe("routeLaunch", () => {
  it("routes a file to the app that claims its extension", () => {
    const result = routeLaunch("/home/me/Research.canvas", apps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.app.manifest.id).toBe("canvas");
    expect(result.plan.argv).toEqual(["/home/me/Research.canvas"]);
    expect(result.plan.why).toBe("file");
  });

  it("routes a deep link to the named app, canonicalised", () => {
    const result = routeLaunch("Suite://CANVAS/workspace/ws_1?card=c1", apps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.app.manifest.id).toBe("canvas");
    expect(result.plan.argv).toEqual(["suite://canvas/workspace/ws_1?card=c1"]);
    expect(result.plan.why).toBe("deep-link");
  });

  it("routes the app's bare entry link", () => {
    const result = routeLaunch("suite://start/", apps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.app.manifest.id).toBe("start");
    expect(result.plan.argv).toEqual(["suite://start/"]);
  });

  it("refuses a link to an app that is not installed", () => {
    expect(routeLaunch("suite://planner/day/2026-11-04", apps)).toEqual({
      ok: false,
      reason: "unknown-app",
    });
  });

  it("refuses a file no app opens", () => {
    expect(routeLaunch("/home/me/notes.txt", apps)).toEqual({
      ok: false,
      reason: "unknown-extension",
    });
  });

  it("refuses a relative path rather than resolving it against the cwd", () => {
    expect(routeLaunch("Research.canvas", apps)).toEqual({ ok: false, reason: "not-a-path" });
  });

  it("refuses a path that climbs", () => {
    expect(routeLaunch("/home/me/../etc/Research.canvas", apps)).toEqual({
      ok: false,
      reason: "not-a-path",
    });
  });

  it("refuses an empty target", () => {
    expect(routeLaunch("   ", apps)).toEqual({ ok: false, reason: "empty-target" });
  });

  it("refuses a non-suite scheme outright", () => {
    expect(routeLaunch("file:///etc/passwd", apps)).toEqual({
      ok: false,
      reason: "not-a-path",
    });
  });

  it("passes a deep-link refusal through from the parser", () => {
    expect(routeLaunch("suite://canvas/../../etc/passwd", apps)).toEqual({
      ok: false,
      reason: "unsafe-segment",
    });
    expect(routeLaunch("suite://canvas@evil.example/x", apps)).toEqual({
      ok: false,
      reason: "credentials-or-port",
    });
  });
});

describe("spawnCommand", () => {
  it("is the executable and its arguments", () => {
    const result = routeLaunch("/home/me/Research.canvas", apps);
    if (!result.ok) throw new Error("expected a plan");
    expect(spawnCommand(result.plan)).toEqual({
      command: "/opt/suite/canvas",
      args: ["/home/me/Research.canvas"],
    });
  });
});

describe("describeRouteRejection", () => {
  it("gives the user a sentence for every refusal", () => {
    expect(describeRouteRejection("unknown-extension")).toContain("No installed Suite app");
    expect(describeRouteRejection("app-not-installed")).toContain("not installed");
    expect(describeRouteRejection("not-a-path")).toContain("absolute path");
  });
});
