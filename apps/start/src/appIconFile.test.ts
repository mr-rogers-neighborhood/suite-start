import { describe, expect, it } from "vitest";
import { resolveAppIcon } from "./appIconFile.js";

const base = {
  isPackaged: true,
  resourcesPath: "/opt/suite-start/resources",
  appPath: "/home/person/suite-start/apps/start",
};

describe("resolveAppIcon", () => {
  it("reads the packaged copy of an app's own artwork", () => {
    expect(resolveAppIcon({ ...base, id: "canvas" })).toBe(
      "/opt/suite-start/resources/icons/canvas.png",
    );
  });

  it("reads the source tree in a dev run", () => {
    expect(resolveAppIcon({ ...base, isPackaged: false, id: "planner" })).toBe(
      "/home/person/suite-start/apps/start/build/app-icons/planner.png",
    );
  });

  it("gives every app a different file", () => {
    // The regression this guards: one icon copied under three names.
    const ids = ["canvas", "planner", "budget"];
    const paths = ids.map((id) => resolveAppIcon({ ...base, id }));

    expect(new Set(paths).size).toBe(ids.length);
  });

  it("answers null rather than a path that is not there", () => {
    expect(resolveAppIcon({ ...base, id: "canvas", exists: () => false })).toBeNull();
  });

  it("answers null for an app this build has no artwork for", () => {
    const exists = (path: string) => path.endsWith("canvas.png");
    expect(resolveAppIcon({ ...base, id: "budget", exists })).toBeNull();
  });
});
