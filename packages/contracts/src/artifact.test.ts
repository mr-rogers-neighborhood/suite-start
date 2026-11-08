import { describe, expect, it } from "vitest";

import { parseSuiteArtifact, SUITE_ARTIFACT_FORMAT } from "./artifact.js";

const SHA = "a".repeat(64);
const FINGERPRINT = "b".repeat(32);

const base = {
  format: SUITE_ARTIFACT_FORMAT,
  contractVersion: "1.0.0",
  id: "canvas",
  name: "Suite Canvas",
  version: "0.1.8",
  files: [{ path: "suite-canvas-0.1.8-x86_64.AppImage", sha256: SHA, size: 142_671_251 }],
  signature: { algorithm: "ed25519", keyFingerprint: FINGERPRINT, value: "c2ln" },
} as const;

const app = { ...base, kind: "app" } as const;
const pack = {
  ...base,
  kind: "pack",
  id: "planner",
  name: "Planner",
  entry: "index.js",
} as const;

describe("suite.artifact", () => {
  it("describes a desktop app", () => {
    expect(parseSuiteArtifact(app).ok).toBe(true);
  });

  it("describes a mobile pack, with an entry module", () => {
    expect(parseSuiteArtifact(pack).ok).toBe(true);
  });

  it("refuses an app that names an entry", () => {
    // The install location belongs to the host's registry, written once and checked against the
    // signing identity there. A manifest that names a path lets a tampered one point anywhere.
    const result = parseSuiteArtifact({ ...app, entry: "suite-canvas" });
    expect(result.ok).toBe(false);
  });

  it("refuses a pack with no entry", () => {
    const { entry: _entry, ...withoutEntry } = pack;
    expect(parseSuiteArtifact({ ...withoutEntry, kind: "pack" }).ok).toBe(false);
  });

  it("refuses a path that climbs out of the artifact", () => {
    for (const path of ["../escape.js", "/etc/passwd", "a/../../b"]) {
      const result = parseSuiteArtifact({
        ...pack,
        files: [{ path, sha256: SHA, size: 1 }],
      });
      expect(result.ok, path).toBe(false);
    }
  });

  it("refuses two files at one path", () => {
    const result = parseSuiteArtifact({
      ...pack,
      files: [
        { path: "index.js", sha256: SHA, size: 1 },
        { path: "index.js", sha256: SHA, size: 2 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("refuses a name the fingerprint or hash width cannot support", () => {
    expect(parseSuiteArtifact({ ...pack, files: [{ path: "a", sha256: "abc", size: 1 }] }).ok).toBe(
      false,
    );
    expect(
      parseSuiteArtifact({
        ...pack,
        signature: { ...pack.signature, keyFingerprint: "nope" },
      }).ok,
    ).toBe(false);
    expect(
      parseSuiteArtifact({
        ...pack,
        signature: { ...pack.signature, algorithm: "rsa" },
      }).ok,
    ).toBe(false);
  });

  it("refuses an id that is not the kebab-case the rest of the suite uses", () => {
    for (const id of ["Canvas", "1canvas", "ca nvas", "", "x".repeat(33)]) {
      expect(parseSuiteArtifact({ ...pack, id }).ok, id).toBe(false);
    }
  });

  it("carries a minimum host version only when one is given", () => {
    expect(parseSuiteArtifact(pack).ok).toBe(true);
    const withFloor = parseSuiteArtifact({ ...pack, minimumHostVersion: "0.4.0" });
    expect(withFloor.ok).toBe(true);
    expect(parseSuiteArtifact({ ...pack, minimumHostVersion: "soon" }).ok).toBe(false);
  });

  it("rejects unknown fields rather than silently dropping them", () => {
    // A strict shape is how a future field becomes a visible mismatch instead of a quiet omission.
    expect(parseSuiteArtifact({ ...app, installed: true }).ok).toBe(false);
  });
});
