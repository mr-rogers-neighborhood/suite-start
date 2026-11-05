import { describe, expect, it } from "vitest";
import {
  deepLinkPrefix,
  formatDeepLink,
  parseDeepLink,
  WORKSPACE_SEGMENT,
  workspaceLink,
} from "./deepLink.js";

function parsed(value: string, apps?: readonly string[]) {
  const result = parseDeepLink(value, apps ? { apps } : {});
  if (!result.ok) throw new Error(`expected ${value} to parse, got ${result.reason}`);
  return result.value;
}

function rejected(value: string, apps?: readonly string[]): string {
  const result = parseDeepLink(value, apps ? { apps } : {});
  if (result.ok) throw new Error(`expected ${value} to be refused`);
  return result.reason;
}

describe("parseDeepLink", () => {
  it("reads an app, its segments and its query", () => {
    expect(parsed("suite://canvas/workspace/ws_1?card=card_9")).toEqual({
      app: "canvas",
      segments: ["workspace", "ws_1"],
      query: { card: "card_9" },
    });
  });

  it("treats the bare prefix as the app's entry point", () => {
    expect(parsed("suite://canvas/").segments).toEqual([]);
    expect(parsed("suite://canvas").segments).toEqual([]);
  });

  it("lower-cases the app id, because opaque hosts keep their case", () => {
    expect(parsed("suite://CANVAS/workspace/ws_1").app).toBe("canvas");
  });

  it("decodes percent-encoded segments once", () => {
    expect(parsed("suite://canvas/a%20b").segments).toEqual(["a b"]);
  });

  it("keeps the first value of a repeated query key", () => {
    expect(parsed("suite://canvas/x?card=first&card=second").query).toEqual({ card: "first" });
  });

  it.each([
    ["https://canvas/workspace/ws_1", "not-a-suite-url"],
    ["file:///etc/passwd", "not-a-suite-url"],
    ["suite-canvas://workspace/ws_1", "not-a-suite-url"],
    ["canvas/workspace", "not-a-suite-url"],
  ])("refuses %s", (value, reason) => {
    expect(rejected(value)).toBe(reason);
  });

  it("refuses an authority that names a user or a port", () => {
    expect(rejected("suite://canvas@evil.example/x")).toBe("credentials-or-port");
    expect(rejected("suite://canvas:8080/x")).toBe("credentials-or-port");
  });

  it("refuses a fragment, because nothing defines one yet", () => {
    expect(rejected("suite://canvas/x#k=secret")).toBe("fragment-not-supported");
  });

  it("refuses an app it was not told about", () => {
    expect(rejected("suite://notes/x")).toBe("unknown-app");
    expect(rejected("suite://budget/x", ["canvas"])).toBe("unknown-app");
  });

  it("refuses an empty host", () => {
    expect(rejected("suite:///canvas/x")).toBe("unknown-app");
  });

  it.each([
    "suite://canvas/a/../b",
    "suite://canvas/../etc/passwd",
    "suite://canvas/a/%2e%2e/b",
    "suite://canvas/a/%2E%2E/b",
    "suite://canvas/./b",
  ])("refuses a segment that climbs in %s", (value) => {
    expect(rejected(value)).toBe("unsafe-segment");
  });

  it("refuses a backslash or a control character", () => {
    expect(rejected("suite://canvas/a%5Cb")).toBe("unsafe-segment");
    expect(rejected("suite://canvas/a%00b")).toBe("unsafe-segment");
    expect(rejected("suite://canvas/a%0Ab")).toBe("unsafe-segment");
  });

  it("refuses a malformed escape rather than guessing", () => {
    expect(rejected("suite://canvas/a%zz")).toBe("unsafe-segment");
  });

  it("refuses more than sixteen segments", () => {
    const many = Array.from({ length: 17 }, (_, index) => `s${index}`).join("/");
    expect(rejected(`suite://canvas/${many}`)).toBe("too-many-segments");
  });

  it("collapses doubled and trailing slashes without inventing a segment", () => {
    expect(parsed("suite://canvas//a//b//").segments).toEqual(["a", "b"]);
  });
});

describe("formatDeepLink", () => {
  it("round-trips through the parser", () => {
    const link = formatDeepLink("canvas", ["workspace", "ws 1"], { card: "card_9" });
    expect(link).not.toBeNull();
    if (link === null) return;
    const value = parsed(link);
    expect(value).toEqual({
      app: "canvas",
      segments: ["workspace", "ws 1"],
      query: { card: "card_9" },
    });
  });

  it("builds the bare entry link", () => {
    expect(formatDeepLink("start")).toBe("suite://start/");
  });

  it.each(["Canvas", "canvas!", "", "1canvas"])("refuses the app id %s", (app) => {
    expect(formatDeepLink(app)).toBeNull();
  });

  it.each(["..", ".", "", "a/b", "a\\b"])("refuses the segment %s", (segment) => {
    expect(formatDeepLink("canvas", [segment])).toBeNull();
  });
});

describe("deepLinkPrefix", () => {
  it("is the app's own scheme", () => {
    expect(deepLinkPrefix("budget")).toBe("suite://budget/");
  });
});

describe("workspaceLink", () => {
  it("names the workspace in a shape every app shares", () => {
    expect(workspaceLink("canvas", "ws_1")).toBe("suite://canvas/workspace/ws_1");
    expect(workspaceLink("planner", "ws_2")).toBe("suite://planner/workspace/ws_2");
  });

  it("round-trips through the parser", () => {
    const link = workspaceLink("canvas", "ws_1");
    if (link === null) throw new Error("expected a link");
    const parsed = parseDeepLink(link, { apps: ["canvas"] });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.segments).toEqual([WORKSPACE_SEGMENT, "ws_1"]);
  });

  it("refuses an id that would not survive parsing", () => {
    expect(workspaceLink("canvas", "..")).toBeNull();
    expect(workspaceLink("canvas", "a/b")).toBeNull();
  });
});
