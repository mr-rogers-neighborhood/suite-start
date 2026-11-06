import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeSignature,
  SUITE_UPDATE_PUBLIC_KEY,
  updateKeyFingerprint,
  verifyUpdateManifest,
} from "./updateSignature.js";

const manifest = new TextEncoder().encode("version: 0.6.0\nfiles: []\n");

/** A throwaway keypair, so the test never depends on the publisher's key. */
const pair = generateKeyPairSync("ed25519");
const otherPrivate = pair.privateKey;
const otherPublic = pair.publicKey.export({ type: "spki", format: "pem" }).toString();

describe("verifyUpdateManifest", () => {
  it("accepts a manifest the publisher signed", () => {
    const signature = sign(null, manifest, otherPrivate);
    expect(verifyUpdateManifest(manifest, signature, otherPublic)).toBe(true);
  });

  it("refuses a manifest signed by somebody else", () => {
    const signature = sign(null, manifest, otherPrivate);
    // Signed by a key that is not the one pinned here.
    expect(verifyUpdateManifest(manifest, signature)).toBe(false);
  });

  it("refuses a manifest changed after it was signed", () => {
    const signature = sign(null, manifest, otherPrivate);
    const tampered = new TextEncoder().encode("version: 9.9.9\nfiles: []\n");
    expect(verifyUpdateManifest(tampered, signature, otherPublic)).toBe(false);
  });

  it("refuses a signature that is not a signature", () => {
    expect(verifyUpdateManifest(manifest, new Uint8Array([1, 2, 3]), otherPublic)).toBe(false);
  });

  it("verifies byte for byte: a trailing newline matters", () => {
    const signature = sign(null, manifest, otherPrivate);
    const withNewline = new TextEncoder().encode(`${new TextDecoder().decode(manifest)}\n`);
    expect(verifyUpdateManifest(withNewline, signature, otherPublic)).toBe(false);
  });
});

describe("the pinned key", () => {
  it("is an Ed25519 public key the crypto module accepts", () => {
    expect(SUITE_UPDATE_PUBLIC_KEY).toContain("BEGIN PUBLIC KEY");
    expect(updateKeyFingerprint()).toMatch(/^[0-9a-f]{32}$/u);
  });

  it("is stable, so a rotation shows up as a changed fingerprint", () => {
    expect(updateKeyFingerprint()).toBe(updateKeyFingerprint());
  });
});

describe("decodeSignature", () => {
  it("reads the base64 published beside a manifest", () => {
    const signature = sign(null, manifest, otherPrivate);
    const base64 = Buffer.from(signature).toString("base64");
    expect(Buffer.from(decodeSignature(base64)).equals(signature)).toBe(true);
  });
});
