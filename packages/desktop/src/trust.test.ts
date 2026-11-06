import { describe, expect, it } from "vitest";
import { isTrustedSender, originKey } from "./trust.js";

describe("originKey", () => {
  it("names a custom-scheme origin without relying on `URL.origin`", () => {
    expect(originKey("app://canvas/index.html?x=1")).toBe("app://canvas");
  });

  it("keeps a port on an http origin", () => {
    expect(originKey("http://localhost:5173/index.html")).toBe("http://localhost:5173");
  });

  it("lower-cases the host", () => {
    expect(originKey("app://Canvas/index.html")).toBe("app://canvas");
  });

  it("refuses a URL that does not parse or has no host", () => {
    expect(originKey("not a url")).toBeNull();
    expect(originKey("file:///tmp/index.html")).toBeNull();
  });
});

describe("isTrustedSender", () => {
  const allowed = ["app://canvas", "http://localhost:5173"];

  it("accepts the bundled page and the dev server", () => {
    expect(isTrustedSender("app://canvas/index.html", allowed)).toBe(true);
    expect(isTrustedSender("http://localhost:5173/index.html?board=1", allowed)).toBe(true);
  });

  it("refuses another app, another port or another scheme", () => {
    expect(isTrustedSender("app://planner/index.html", allowed)).toBe(false);
    expect(isTrustedSender("http://localhost:5174/index.html", allowed)).toBe(false);
    expect(isTrustedSender("https://localhost:5173/index.html", allowed)).toBe(false);
  });

  it("refuses a missing frame", () => {
    expect(isTrustedSender(undefined, allowed)).toBe(false);
    expect(isTrustedSender(null, allowed)).toBe(false);
  });

  it("refuses an empty allowlist", () => {
    expect(isTrustedSender("app://canvas/index.html", [])).toBe(false);
  });
});
