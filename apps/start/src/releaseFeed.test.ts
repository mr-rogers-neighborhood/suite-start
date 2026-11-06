import { describe, expect, it } from "vitest";
import { checkFeed, type FeedFetch, feedFileFor, versionFromFeed } from "./releaseFeed.js";

const feed = `version: 0.6.0
files:
  - url: suite-canvas-0.6.0.AppImage
    sha512: abc
    size: 1024
path: suite-canvas-0.6.0.AppImage
sha512: abc
releaseDate: '2026-11-06T12:00:00.000Z'
`;

function fetchOf(status: number, body: string): FeedFetch {
  return async () => ({ ok: status >= 200 && status < 300, status, text: async () => body });
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
    expect(versionFromFeed(feed)).toBe("0.6.0");
  });

  it("tolerates quotes and a preface", () => {
    expect(versionFromFeed("provider: github\nversion: '1.2.3'\n")).toBe("1.2.3");
  });

  it("is null for a file that names no version", () => {
    expect(versionFromFeed("files: []\n")).toBeNull();
    expect(versionFromFeed("version:\n")).toBeNull();
  });
});

describe("checkFeed", () => {
  const now = () => new Date("2026-11-06T12:00:00.000Z");

  it("asks the app's own feed file", async () => {
    const seen: string[] = [];
    const fetch: FeedFetch = async (url) => {
      seen.push(url);
      return { ok: true, status: 200, text: async () => feed };
    };
    await checkFeed("https://releases.example.test/canvas/stable/", "linux", fetch, now);
    expect(seen).toEqual(["https://releases.example.test/canvas/stable/latest-linux.yml"]);
  });

  it("returns the version and when it checked", async () => {
    const check = await checkFeed("https://x.test/c", "linux", fetchOf(200, feed), now);
    expect(check).toEqual({
      version: "0.6.0",
      reason: null,
      checkedAt: "2026-11-06T12:00:00.000Z",
    });
  });

  it("says what went wrong instead of pretending", async () => {
    expect((await checkFeed("https://x.test/c", "linux", fetchOf(404, ""), now)).reason).toBe(
      "the feed answered 404",
    );
    expect((await checkFeed("https://x.test/c", "linux", fetchOf(200, "nope"), now)).reason).toBe(
      "the feed named no version",
    );
    const unreachable: FeedFetch = async () => {
      throw new Error("offline");
    };
    expect((await checkFeed("https://x.test/c", "linux", unreachable, now)).reason).toBe(
      "the feed could not be reached",
    );
  });
});
