import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
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
