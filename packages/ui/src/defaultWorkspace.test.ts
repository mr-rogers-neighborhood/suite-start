import { describe, expect, it } from "vitest";
import { missingDefaultSentence, readDefault, resolveDefault } from "./defaultWorkspace.js";

describe("readDefault", () => {
  it("reads a stored record", () => {
    expect(readDefault({ id: "ws-1", name: "Research" })).toEqual({ id: "ws-1", name: "Research" });
  });

  it("falls back to the id when no name was stored", () => {
    expect(readDefault({ id: "ws-1" })).toEqual({ id: "ws-1", name: "ws-1" });
  });

  it("answers null for anything that is not a record", () => {
    expect(readDefault(null)).toBeNull();
    expect(readDefault(undefined)).toBeNull();
    expect(readDefault("ws-1")).toBeNull();
    expect(readDefault({})).toBeNull();
    expect(readDefault({ id: "" })).toBeNull();
    expect(readDefault({ id: 7 })).toBeNull();
  });
});

describe("resolveDefault", () => {
  it("opens the default when it is there", () => {
    expect(resolveDefault({ id: "ws-1", name: "Research" }, () => true)).toEqual({
      kind: "open",
      id: "ws-1",
    });
  });

  it("says so when the default has gone, rather than opening nothing", () => {
    // A default that silently failed would leave a person staring at nothing, which is worse
    // than the launcher they were trying to avoid.
    expect(resolveDefault({ id: "ws-1", name: "Research" }, () => false)).toEqual({
      kind: "missing",
      name: "Research",
    });
  });

  it("does nothing when no default is set", () => {
    expect(resolveDefault(null, () => true)).toEqual({ kind: "none" });
  });

  it("does not consult the filesystem for a record it cannot use", () => {
    let asked = 0;
    resolveDefault(null, () => {
      asked += 1;
      return true;
    });
    expect(asked).toBe(0);
  });
});

describe("missingDefaultSentence", () => {
  it("names the thing that moved, so the message is actionable", () => {
    expect(missingDefaultSentence("Research")).toContain("Research");
    expect(missingDefaultSentence("Research")).toContain("not where it was");
  });
});
