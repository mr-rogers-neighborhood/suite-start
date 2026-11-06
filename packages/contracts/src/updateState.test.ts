import { describe, expect, it } from "vitest";
import { parseUpdateState, SUITE_UPDATE_STATE_FILE, updateAvailable } from "./updateState.js";

function state(version: string, available: string | null) {
  return {
    format: "suite.update-state" as const,
    version,
    available,
    checkedAt: "2026-11-06T12:00:00.000Z",
    channel: "stable" as const,
  };
}

describe("the update state file", () => {
  it("is named where the app keeps its own state", () => {
    expect(SUITE_UPDATE_STATE_FILE).toBe("update-state.json");
  });

  it("parses a report an app wrote", () => {
    const parsed = parseUpdateState(state("0.4.0", null));
    expect(parsed.ok).toBe(true);
  });

  it("refuses a report that names another format", () => {
    const parsed = parseUpdateState({ ...state("0.4.0", null), format: "suite.deployment" });
    expect(parsed.ok).toBe(false);
  });

  it("refuses a report with no checkedAt key at all is not required", () => {
    const { checkedAt: _checkedAt, ...without } = state("0.4.0", null);
    expect(parseUpdateState(without).ok).toBe(true);
  });
});

describe("updateAvailable", () => {
  it("says nothing when the feed offered nothing", () => {
    expect(updateAvailable(state("0.4.0", null))).toBe(false);
  });

  it("says nothing when the feed offers the same version", () => {
    expect(updateAvailable(state("0.4.0", "0.4.0"))).toBe(false);
  });

  it("sees a newer patch, minor and major", () => {
    expect(updateAvailable(state("0.4.0", "0.4.1"))).toBe(true);
    expect(updateAvailable(state("0.4.0", "0.5.0"))).toBe(true);
    expect(updateAvailable(state("0.4.0", "1.0.0"))).toBe(true);
  });

  it("does not offer an older version", () => {
    expect(updateAvailable(state("0.5.0", "0.4.9"))).toBe(false);
  });

  it("compares prerelease numbers as numbers, not strings", () => {
    // The failure a plain string comparison produces: "alpha.10" < "alpha.9".
    expect(updateAvailable(state("0.1.0-alpha.9", "0.1.0-alpha.10"))).toBe(true);
    expect(updateAvailable(state("0.1.0-alpha.10", "0.1.0-alpha.9"))).toBe(false);
  });

  it("treats a prerelease as older than its release", () => {
    expect(updateAvailable(state("0.1.0-alpha.3", "0.1.0"))).toBe(true);
    expect(updateAvailable(state("0.1.0", "0.1.0-alpha.3"))).toBe(false);
  });
});
