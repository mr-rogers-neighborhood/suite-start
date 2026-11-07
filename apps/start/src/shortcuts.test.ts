import { describe, expect, it } from "vitest";
import {
  shortcutFilename,
  shortcutIconPath,
  shortcutPath,
  shortcutText,
  wmClassFor,
} from "./shortcuts.js";

const planner = {
  id: "planner",
  name: "Suite Planner",
  executable: "/home/me/Applications/Suite/Planner/0.2.0/suite-planner-0.2.0-x86_64.AppImage",
  extensions: ["planner"],
  iconName: "suite-planner",
};

describe("shortcutFilename", () => {
  it("is one file per app, so an update rewrites rather than accumulates", () => {
    expect(shortcutFilename("planner")).toBe("suite-planner.desktop");
  });
});

describe("shortcutPath", () => {
  it("lives in the user's own applications directory, so nothing needs root", () => {
    expect(shortcutPath("linux", "/home/me", "planner")).toBe(
      "/home/me/.local/share/applications/suite-planner.desktop",
    );
  });
});

describe("shortcutIconPath", () => {
  it("puts the icon where a theme lookup finds it by size", () => {
    expect(shortcutIconPath("linux", "/home/me", "suite-planner")).toBe(
      "/home/me/.local/share/icons/hicolor/256x256/apps/suite-planner.png",
    );
  });
});

describe("shortcutText", () => {
  it("starts the installed executable and claims the app's file type", () => {
    const text = shortcutText(planner);
    expect(text).toContain("[Desktop Entry]");
    expect(text).toContain("Type=Application");
    expect(text).toContain(`Exec="${planner.executable}" %U`);
    expect(text).toContain("Icon=suite-planner");
    expect(text).toContain("MimeType=application/x-suite-planner;");
    // Measured: the installed Canvas AppImage reports "suite-canvas", not "Suite Canvas".
    expect(text).toContain("StartupWMClass=suite-planner");
    expect(text).not.toContain("StartupWMClass=Suite Planner");
  });

  it("does not claim a file handler for an app that opens nothing", () => {
    const text = shortcutText({ ...planner, id: "scratch", name: "Scratch", extensions: [] });
    expect(text).not.toContain("MimeType=");
    expect(text).toContain("Comment=Opens documents with Scratch");
  });

  it("quotes a path that would otherwise split an Exec line", () => {
    // AppImage names are space-free by convention, but a person's own build may not be.
    const text = shortcutText({
      ...planner,
      executable: "/home/me/Suite Planner.AppImage",
    });
    expect(text).toContain('Exec="/home/me/Suite Planner.AppImage" %U');
  });

  it("escapes a quote rather than ending the argument early", () => {
    const text = shortcutText({ ...planner, executable: '/home/me/odd"name.AppImage' });
    expect(text).toContain('Exec="/home/me/odd\\"name.AppImage" %U');
  });
});

describe("wmClassFor", () => {
  it("is the executableName each app's packaging sets, which is what its window reports", () => {
    // Measured from the installed Canvas AppImage: "suite-canvas", "Suite-canvas".
    expect(wmClassFor("canvas")).toBe("suite-canvas");
    expect(wmClassFor("planner")).toBe("suite-planner");
    expect(wmClassFor("budget")).toBe("suite-budget");
    // And the hub's own entry declares the same shape.
    expect(wmClassFor("start")).toBe("suite-start");
  });
});
