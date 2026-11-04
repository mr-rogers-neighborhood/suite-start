import { describe, expect, it } from "vitest";
import { archivePathProblem, isSafeArchivePath } from "./archivePaths.js";

describe("archivePathProblem", () => {
  it.each([
    "manifest.json",
    "apps/canvas/workspace.canvas",
    "apps/budget/household.budget",
    "README.txt",
    "a-1/b_2/c.3",
  ])("accepts %s", (entry) => {
    expect(archivePathProblem(entry)).toBeNull();
  });

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["/etc/passwd", "absolute"],
    ["C:/Windows/system32", "drive-letter"],
    ["c:relative", "drive-letter"],
    ["apps\\canvas\\x", "backslash"],
    ["../secret", "traversal"],
    ["apps/../../secret", "traversal"],
    ["apps/./x", "traversal"],
    ["apps//x", "traversal"],
    ["apps/%2e%2e/secret", "traversal"],
    ["apps/%2E%2E/secret", "traversal"],
    ["apps/a%2Fb", "traversal"],
    ["apps/a%00b", "control-character"],
    ["apps/a\u0007b", "control-character"],
    ["apps/trailing.", "trailing-dot-or-space"],
    ["apps/trailing ", "trailing-dot-or-space"],
    ["apps/CON", "reserved-name"],
    ["apps/con.txt", "reserved-name"],
    ["apps/LPT1/data.bin", "reserved-name"],
    ["apps/%zz", "malformed-escape"],
  ])("refuses %s as %s", (entry, reason) => {
    expect(archivePathProblem(entry)).toBe(reason);
  });

  it("refuses a path longer than a kilobyte", () => {
    expect(archivePathProblem(`a/${"b".repeat(1100)}`)).toBe("too-long");
  });

  it("accepts a name that merely contains a reserved word", () => {
    expect(archivePathProblem("apps/console.txt")).toBeNull();
    expect(archivePathProblem("apps/com10.txt")).toBeNull();
  });
});

describe("isSafeArchivePath", () => {
  it("is the predicate form", () => {
    expect(isSafeArchivePath("apps/canvas/workspace.canvas")).toBe(true);
    expect(isSafeArchivePath("../workspace.canvas")).toBe(false);
  });
});
