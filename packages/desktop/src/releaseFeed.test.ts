import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  artifactFromFeed,
  checkSignedFeed,
  type FeedFetch,
  feedFileFor,
  feedUrlFromAppUpdateYml,
  versionFromFeed,
} from "./releaseFeed.js";
import { SUITE_UPDATE_PUBLIC_KEY } from "./updateSignature.js";

const manifest = "version: 0.6.0\nfiles:\n  - url: Suite Canvas-0.6.0.AppImage\n";

const now = () => new Date("2026-11-06T12:00:00.000Z");

function signedManifest(): string {
  // Only the publisher's own key can sign for the pinned key, and the test does not
  // have it. So the test proves the *refusal* paths here; the acceptance path is
  // covered by `verifyUpdateManifest` with a throwaway pair.
  return manifest;
}

function fetchMap(entries: Record<string, { status: number; body: string }>): FeedFetch {
  return async (url) => {
    const found = entries[url];
    if (found === undefined) return { ok: false, status: 404, text: async () => "" };
    return {
      ok: found.status >= 200 && found.status < 300,
      status: found.status,
      text: async () => found.body,
    };
  };
}

describe("feedFileFor", () => {
  it("names the file the updater looks for on each platform", () => {
    expect(feedFileFor("linux")).toBe("latest-linux.yml");
    expect(feedFileFor("darwin")).toBe("latest-mac.yml");
    expect(feedFileFor("win32")).toBe("latest.yml");
  });
});

describe("versionFromFeed", () => {
  it("reads the version the updater would read", () => {
    expect(versionFromFeed(manifest)).toBe("0.6.0");
  });

  it("is null for a file that names no version", () => {
    expect(versionFromFeed("files: []\n")).toBeNull();
  });
});

describe("feedUrlFromAppUpdateYml", () => {
  it("reads the URL electron-builder recorded beside the app", () => {
    const yml =
      "provider: generic\nurl: https://example.test/releases/latest/download\nupdaterCacheDirName: x\n";
    expect(feedUrlFromAppUpdateYml(yml)).toBe("https://example.test/releases/latest/download");
  });

  it("is null when the file names no URL", () => {
    expect(feedUrlFromAppUpdateYml("provider: generic\n")).toBeNull();
  });
});

describe("artifactFromFeed", () => {
  // A real `latest-linux.yml`, so the parser is measured against the file's own
  // shape rather than a remembered one.
  const real = readFileSync(new URL("./fixtures/latest-linux.yml", import.meta.url), "utf8");

  it("reads the file, its fingerprint and its size from a real feed", () => {
    expect(artifactFromFeed(real)).toEqual({
      path: "suite-canvas-0.1.0-x86_64.AppImage",
      sha512:
        "dmuphTeY3G3RNc7+S0bRU3Me//dFxNoBSKMsdOGlNIBxe/tz0f1IoBv3mYOAP//cZ3qEVWCO0PNK0aLSl+J5bQ==",
      size: 153291139,
    });
  });

  it("prefers the primary file over the block map beside it", () => {
    const feed = [
      "version: 1.0.0",
      "files:",
      "  - url: Suite.AppImage.blockmap",
      "    sha512: AAA",
      "    size: 12",
      "  - url: Suite.AppImage",
      "    sha512: BBB",
      "    size: 34",
      "path: Suite.AppImage",
      "sha512: BBB",
      "releaseDate: '2026-01-01T00:00:00.000Z'",
      "",
    ].join("\n");
    expect(artifactFromFeed(feed)).toEqual({ path: "Suite.AppImage", sha512: "BBB", size: 34 });
  });

  it("does not follow a file name out of the folder it sits in", () => {
    const feed = ["version: 1.0.0", "path: ../../etc/passwd", "sha512: CCC", ""].join("\n");
    expect(artifactFromFeed(feed)).toBeNull();
  });

  it("is null when the feed names no fingerprint, because there is nothing to check", () => {
    expect(artifactFromFeed("version: 1.0.0\nfiles:\n  - url: Suite.AppImage\n")).toBeNull();
  });

  it("is null for a feed with no files at all", () => {
    expect(artifactFromFeed("version: 1.0.0\n")).toBeNull();
  });

  it("keeps the size null rather than inventing one", () => {
    expect(artifactFromFeed("version: 1.0.0\npath: Suite.AppImage\nsha512: DDD\n")).toEqual({
      path: "Suite.AppImage",
      sha512: "DDD",
      size: null,
    });
  });
});

describe("checkSignedFeed, accepting path", () => {
  it("returns the version when the signature verifies", async () => {
    const pair = generateKeyPairSync("ed25519");
    const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
    const signature = sign(null, new TextEncoder().encode(manifest), pair.privateKey).toString(
      "base64",
    );
    const base = "https://example.test/r";
    const check = await checkSignedFeed(
      base,
      "linux",
      fetchMap({
        [`${base}/latest-linux.yml`]: { status: 200, body: manifest },
        [`${base}/latest-linux.yml.sig`]: { status: 200, body: signature },
      }),
      now,
      publicKey,
    );
    expect(check).toEqual({
      version: "0.6.0",
      reason: null,
      checkedAt: "2026-11-06T12:00:00.000Z",
      verified: true,
      artifact: null,
    });
  });

  it("carries the artifact from the bytes the signature covered", async () => {
    const signed =
      "version: 0.6.0\nfiles:\n  - url: Suite Canvas-0.6.0.AppImage\n    sha512: ABC\n    size: 42\n";
    const pair = generateKeyPairSync("ed25519");
    const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
    const signature = sign(null, new TextEncoder().encode(signed), pair.privateKey).toString(
      "base64",
    );
    const base = "https://example.test/r";
    const check = await checkSignedFeed(
      base,
      "linux",
      fetchMap({
        [`${base}/latest-linux.yml`]: { status: 200, body: signed },
        [`${base}/latest-linux.yml.sig`]: { status: 200, body: signature },
      }),
      now,
      publicKey,
    );
    expect(check.artifact).toEqual({
      path: "Suite Canvas-0.6.0.AppImage",
      sha512: "ABC",
      size: 42,
    });
  });
});

describe("checkSignedFeed", () => {
  const base = "https://example.test/releases/latest/download";

  it("refuses a feed that publishes no signature", async () => {
    const check = await checkSignedFeed(
      base,
      "linux",
      fetchMap({ [`${base}/latest-linux.yml`]: { status: 200, body: signedManifest() } }),
      now,
    );
    expect(check.verified).toBe(false);
    expect(check.reason).toContain("no signature");
    expect(check.version).toBeNull();
  });

  it("refuses a signature that does not verify", async () => {
    const other = generateKeyPairSync("ed25519");
    const bogus = sign(null, new TextEncoder().encode(manifest), other.privateKey).toString(
      "base64",
    );
    const check = await checkSignedFeed(
      base,
      "linux",
      fetchMap({
        [`${base}/latest-linux.yml`]: { status: 200, body: signedManifest() },
        [`${base}/latest-linux.yml.sig`]: { status: 200, body: bogus },
      }),
      now,
    );
    expect(check.verified).toBe(false);
    expect(check.reason).toBe("the manifest is not signed by the publisher");
  });

  it("refuses a feed that does not answer, and says why", async () => {
    const check = await checkSignedFeed(base, "linux", fetchMap({}), now);
    expect(check.reason).toBe("the feed answered 404");
  });

  it("says a manifest signed by another key is not ours", async () => {
    const other = generateKeyPairSync("ed25519");
    const signature = sign(null, new TextEncoder().encode(manifest), other.privateKey).toString(
      "base64",
    );
    const check = await checkSignedFeed(
      base,
      "linux",
      fetchMap({
        [`${base}/latest-linux.yml`]: { status: 200, body: manifest },
        [`${base}/latest-linux.yml.sig`]: { status: 200, body: signature },
      }),
      now,
    );
    expect(check.verified).toBe(false);
    expect(check.version).toBeNull();
    expect(SUITE_UPDATE_PUBLIC_KEY).toContain("BEGIN PUBLIC KEY");
  });
});
