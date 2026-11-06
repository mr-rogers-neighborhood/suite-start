import { describe, expect, it } from "vitest";
import { resolveProtocolAsset } from "./protocol.js";

const ROOT = "/app/renderer";
const OPTIONS = { scheme: "app", hosts: ["canvas"] } as const;

describe("resolveProtocolAsset", () => {
  it("serves index.html for an empty path", () => {
    expect(resolveProtocolAsset("app://canvas/", ROOT, OPTIONS)).toEqual({
      ok: true,
      file: "/app/renderer/index.html",
    });
    expect(resolveProtocolAsset("app://canvas", ROOT, OPTIONS)).toEqual({
      ok: true,
      file: "/app/renderer/index.html",
    });
  });

  it("serves a nested asset", () => {
    expect(resolveProtocolAsset("app://canvas/assets/main-abc.js", ROOT, OPTIONS)).toEqual({
      ok: true,
      file: "/app/renderer/assets/main-abc.js",
    });
  });

  it("keeps a query string out of the file name", () => {
    expect(resolveProtocolAsset("app://canvas/index.html?workspace=ws_1", ROOT, OPTIONS)).toEqual({
      ok: true,
      file: "/app/renderer/index.html",
    });
  });

  it("refuses another app's host", () => {
    expect(resolveProtocolAsset("app://planner/index.html", ROOT, OPTIONS)).toEqual({ ok: false });
  });

  it("refuses another scheme", () => {
    expect(resolveProtocolAsset("other://canvas/index.html", ROOT, OPTIONS)).toEqual({ ok: false });
    expect(resolveProtocolAsset("file:///app/renderer/index.html", ROOT, OPTIONS)).toEqual({
      ok: false,
    });
  });

  it("refuses a climb before the URL parser can normalise it", () => {
    expect(resolveProtocolAsset("app://canvas/../../etc/passwd", ROOT, OPTIONS)).toEqual({
      ok: false,
    });
    expect(resolveProtocolAsset("app://canvas/%2e%2e/%2e%2e/etc/passwd", ROOT, OPTIONS)).toEqual({
      ok: false,
    });
    expect(
      resolveProtocolAsset("app://canvas/assets/../../../../etc/passwd", ROOT, OPTIONS),
    ).toEqual({ ok: false });
  });

  it("refuses a sibling directory that shares the prefix", () => {
    expect(resolveProtocolAsset("app://canvas/../rendererevil/x.js", ROOT, OPTIONS)).toEqual({
      ok: false,
    });
  });

  it("refuses a control character or an encoded separator", () => {
    expect(resolveProtocolAsset("app://canvas/a%00b.js", ROOT, OPTIONS)).toEqual({ ok: false });
    expect(resolveProtocolAsset("app://canvas/a%2Fb.js", ROOT, OPTIONS)).toEqual({ ok: false });
    expect(resolveProtocolAsset("app://canvas/a%5Cb.js", ROOT, OPTIONS)).toEqual({ ok: false });
  });
});
