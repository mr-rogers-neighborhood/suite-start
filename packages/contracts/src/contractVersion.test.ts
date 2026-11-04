import { describe, expect, it } from "vitest";
import {
  CONTRACT_VERSION,
  compareSemver,
  isContractCompatible,
  parseSemver,
} from "./contractVersion.js";

describe("parseSemver", () => {
  it("reads a release", () => {
    expect(parseSemver("1.4.2")).toEqual({ major: 1, minor: 4, patch: 2, prerelease: null });
  });

  it("reads a prerelease and ignores build metadata", () => {
    expect(parseSemver("0.2.0-beta.1+build.7")).toEqual({
      major: 0,
      minor: 2,
      patch: 0,
      prerelease: "beta.1",
    });
  });

  it.each(["1", "1.2", "1.2.3.4", "v1.2.3", "", "1.2.x"])("rejects %s", (value) => {
    expect(parseSemver(value)).toBeNull();
  });
});

describe("compareSemver", () => {
  const order = [
    "1.0.0-alpha.1",
    "1.0.0-alpha.2",
    "1.0.0-beta",
    "1.0.0",
    "1.0.1",
    "1.1.0",
    "2.0.0",
  ];

  it("orders the whole line", () => {
    for (let index = 0; index < order.length - 1; index += 1) {
      const left = parseSemver(order[index] ?? "");
      const right = parseSemver(order[index + 1] ?? "");
      expect(left).not.toBeNull();
      expect(right).not.toBeNull();
      if (!left || !right) return;
      expect(compareSemver(left, right)).toBeLessThan(0);
      expect(compareSemver(right, left)).toBeGreaterThan(0);
    }
  });

  it("treats the same version as equal", () => {
    const left = parseSemver("1.2.3");
    const right = parseSemver("1.2.3");
    if (!left || !right) throw new Error("fixture did not parse");
    expect(compareSemver(left, right)).toBe(0);
  });

  it("sorts numeric identifiers below alphanumeric ones", () => {
    const numeric = parseSemver("1.0.0-1");
    const alpha = parseSemver("1.0.0-alpha");
    if (!numeric || !alpha) throw new Error("fixture did not parse");
    expect(compareSemver(numeric, alpha)).toBeLessThan(0);
  });
});

describe("isContractCompatible", () => {
  it("accepts the version it implements", () => {
    expect(isContractCompatible(CONTRACT_VERSION)).toBe(true);
  });

  it("accepts an older minor in the same major", () => {
    expect(isContractCompatible("1.0.0", "1.4.0")).toBe(true);
  });

  it("refuses an app that needs a newer minor than the hub offers", () => {
    expect(isContractCompatible("1.4.0", "1.2.0")).toBe(false);
  });

  it("refuses a different major in either direction", () => {
    expect(isContractCompatible("2.0.0", "1.9.9")).toBe(false);
    expect(isContractCompatible("1.9.9", "2.0.0")).toBe(false);
  });

  it("refuses a string that is not a version", () => {
    expect(isContractCompatible("next")).toBe(false);
  });
});
