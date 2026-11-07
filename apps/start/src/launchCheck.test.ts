import { describe, expect, it } from "vitest";
import { launchVerdict, looksLikeAppImage } from "./launchCheck.js";

const appImage = "/home/me/Applications/Suite/Canvas/0.1.0/suite-canvas-0.1.0-x86_64.AppImage";

describe("looksLikeAppImage", () => {
  it("recognises the one file kind that has a FUSE fallback", () => {
    expect(looksLikeAppImage(appImage)).toBe(true);
    expect(looksLikeAppImage("/opt/suite-start/suite-start")).toBe(false);
  });
});

describe("launchVerdict", () => {
  it("retries an AppImage that wanted FUSE 2, instead of reporting it", () => {
    // The exact lines AppImage's runtime writes, which is how the first real install
    // failed: `dlopen(): error loading libfuse.so.2`.
    const verdict = launchVerdict({
      executable: appImage,
      exitCode: 1,
      stderr:
        "dlopen(): error loading libfuse.so.2\n\nAppImages require FUSE to run.\n" +
        "You might still be able to extract the contents of this AppImage if you run it " +
        "with the --appimage-extract option.\n",
    });
    expect(verdict).toMatchObject({ kind: "retry-without-fuse" });
    expect(verdict.kind === "ok" ? "" : verdict.reason).toContain("FUSE 2");
  });

  it("reports a missing library the same app would have to install by hand", () => {
    // No AppImage suffix means no fallback exists, so the person is told rather than
    // handed a retry that would fail the same way.
    const verdict = launchVerdict({
      executable: "/opt/suite-start/suite-start",
      exitCode: 127,
      stderr: "error while loading shared libraries: libfuse.so.2: cannot open shared object file",
    });
    expect(verdict).toMatchObject({ kind: "failed" });
    expect(verdict.kind === "ok" ? "" : verdict.reason).toContain("libfuse.so.2");
  });

  it("repeats what the app said, rather than inventing a sentence", () => {
    const verdict = launchVerdict({
      executable: appImage,
      exitCode: 1,
      stderr: "\n  Cannot open workspace: the file was written by a newer version\nmore noise\n",
    });
    expect(verdict).toEqual({
      kind: "failed",
      reason: "Cannot open workspace: the file was written by a newer version",
    });
  });

  it("says something true when the app died without a word", () => {
    expect(launchVerdict({ executable: appImage, exitCode: 3, stderr: "" })).toEqual({
      kind: "failed",
      reason: "it stopped before a window opened (exit 3)",
    });
    expect(launchVerdict({ executable: appImage, exitCode: null, stderr: "   " })).toEqual({
      kind: "failed",
      reason: "it stopped before a window opened",
    });
  });
});
