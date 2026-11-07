import { joinPath } from "@suite/contracts";

/**
 * The menu entry a managed install earns.
 *
 * An app Start placed lives in `~/Applications/Suite`, which no shell searches, so without
 * this it can only be opened from Start. A launcher that keeps an app to itself is the
 * thing this suite is trying not to be — every app in the suite should be launchable the
 * way every other program on the machine is.
 *
 * Two decisions worth naming:
 *
 * - **User scope.** The entry goes in `~/.local/share/applications`, not `/usr/share`. No
 *   root, and it lives and dies with the install that created it.
 * - **One entry per app id**, named `suite-<id>.desktop`, so an update rewrites the entry
 *   rather than accumulating one per version, and an uninstall can delete exactly one file.
 */
export interface ShortcutInput {
  readonly id: string;
  readonly name: string;
  /** Absolute path to the executable this entry starts. */
  readonly executable: string;
  /** What the app opens, for the sentence under its name. */
  readonly extensions: readonly string[];
  /** The icon name a theme lookup uses, without a size or extension. */
  readonly iconName: string;
}

/** The entry's file name, which is also how it is found again. */
export function shortcutFilename(id: string): string {
  return `suite-${id}.desktop`;
}

/** Where one app's entry lives under a user's data directory. */
export function shortcutPath(platform: string, home: string, id: string): string {
  return joinPath(platform, home, ".local", "share", "applications", shortcutFilename(id));
}

/**
 * Where the icon a shortcut points at is installed.
 *
 * The theme directory rather than a bare path, so a panel that asks for a size finds the
 * closest one instead of scaling a file it was handed.
 */
export function shortcutIconPath(
  platform: string,
  home: string,
  iconName: string,
  size = 256,
): string {
  return joinPath(
    platform,
    home,
    ".local",
    "share",
    "icons",
    "hicolor",
    `${size}x${size}`,
    "apps",
    `${iconName}.png`,
  );
}

/** `.desktop` quoting: a path with a space or a quote must survive a parser. */
function quoted(value: string): string {
  const escaped = value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"');
  return `"${escaped}"`;
}

/**
 * One `[Desktop Entry]` section.
 *
 * `StartupWMClass` is the app's own name because that is what an Electron window reports
 * on X11 when it declares no `desktopName` of its own; a panel uses it to group the window
 * under this entry instead of drawing a second, generic icon.
 */
export function shortcutText(input: ShortcutInput): string {
  const lines = [
    "[Desktop Entry]",
    "Type=Application",
    `Name=${input.name}`,
    `Comment=Opens ${input.extensions.join(", ") || "documents"} with ${input.name}`,
    `Exec=${quoted(input.executable)} %U`,
    `Icon=${input.iconName}`,
    "Terminal=false",
    "Categories=Utility;Office;",
    `StartupWMClass=${wmClassFor(input.id)}`,
  ];

  // Only an app that opens files should claim a handler; otherwise a double-click would
  // be offered a program that cannot do anything with the file.
  const extension = input.extensions[0];
  if (extension !== undefined) {
    lines.push(`MimeType=application/x-suite-${input.id};`);
  }

  return `${lines.join("\n")}\n`;
}

/** The icon name one app's shortcut uses. */
export function shortcutIconName(id: string): string {
  return `suite-${id}`;
}

/**
 * The `WM_CLASS` a bundled app actually reports.
 *
 * Measured, not assumed. The installed Canvas AppImage announces
 * `WM_CLASS(STRING) = "suite-canvas", "Suite-canvas"` — the `executableName` its
 * `electron-builder.yml` sets, which is `suite-` plus the app id, not the product name and
 * not the versioned file name. An entry claiming `Suite Canvas` matches no window, so a
 * panel cannot group the running app under it and draws it on its own.
 */
export function wmClassFor(id: string): string {
  return `suite-${id}`;
}
