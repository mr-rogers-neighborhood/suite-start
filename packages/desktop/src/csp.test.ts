import { describe, expect, it } from "vitest";
import { desktopCsp, scriptSrcDirective } from "./csp.js";

describe("desktopCsp", () => {
  it("closes everything by default", () => {
    const policy = desktopCsp();
    expect(policy.startsWith("default-src 'none'")).toBe(true);
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("allows the WebAssembly the CRDT needs, and not inline scripts", () => {
    const script = scriptSrcDirective();
    expect(script).toContain("'wasm-unsafe-eval'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(script).not.toContain("'unsafe-inline'");
  });

  it("can drop WebAssembly for a page that never runs it", () => {
    const policy = desktopCsp({ wasm: false });
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain("wasm-unsafe-eval");
  });

  it("widens exactly the directive it is given", () => {
    const policy = desktopCsp({ connectSrc: ["ws://127.0.0.1:8787"] });
    expect(policy).toContain("connect-src 'self' ws://127.0.0.1:8787");
    expect(policy).not.toContain("script-src 'self' 'wasm-unsafe-eval' ws://");
  });

  it("does not repeat a value", () => {
    const policy = desktopCsp({ connectSrc: ["'self'"] });
    expect(policy.match(/connect-src/g)).toHaveLength(1);
    expect(policy).toContain("connect-src 'self'");
  });
});
