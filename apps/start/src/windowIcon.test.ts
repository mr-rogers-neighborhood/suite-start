import { describe, expect, it } from "vitest";
import { resolveWindowIcon } from "./windowIcon.js";

const options = {
  isPackaged: true,
  resourcesPath: "/app/resources",
  appPath: "/app/resources/app.asar",
};

/** A filesystem that has exactly the paths given. */
const having =
  (...paths: readonly string[]) =>
  (path: string) =>
    paths.includes(path);

describe("resolveWindowIcon", () => {
  it("prefers the copy a packaged build carries beside the asar", () => {
    // `extraResources` puts it there; it is the only icon a packaged build can read.
    expect(
      resolveWindowIcon({
        ...options,
        exists: having("/app/resources/icon.png", "/app/build/icon.png"),
      }),
    ).toEqual({ path: "/app/resources/icon.png", reason: null });
  });

  it("is null when a packaged build carries none, rather than reaching into a source tree", () => {
    // A packaged app has no `build/` directory: the only icon it can read is the one
    // extraResources put beside the asar.
    expect(
      resolveWindowIcon({ ...options, exists: having("/app/resources/app.asar/build/icon.png") }),
    ).toBeNull();
  });

  it("reads the source tree in a dev run, where there is no resources copy", () => {
    expect(
      resolveWindowIcon({
        ...options,
        isPackaged: false,
        // A dev run's `app.getAppPath()` is the project directory, not an asar.
        appPath: "/app",
        exists: having("/app/build/icon.png"),
      }),
    ).toEqual({ path: "/app/build/icon.png", reason: null });
  });

  it("is null when neither exists, rather than a path that would fail to load", () => {
    expect(resolveWindowIcon({ ...options, exists: having() })).toBeNull();
    expect(resolveWindowIcon({ ...options, isPackaged: false, exists: having() })).toBeNull();
  });
});
