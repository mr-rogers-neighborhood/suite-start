import { joinPath } from "@suite/contracts";
/** The entry's file name, which is also how it is found again. */
export function shortcutFilename(id) {
    return `suite-${id}.desktop`;
}
/** Where one app's entry lives under a user's data directory. */
export function shortcutPath(platform, home, id) {
    return joinPath(platform, home, ".local", "share", "applications", shortcutFilename(id));
}
/**
 * Where the icon a shortcut points at is installed.
 *
 * The theme directory rather than a bare path, so a panel that asks for a size finds the
 * closest one instead of scaling a file it was handed.
 */
export function shortcutIconPath(platform, home, iconName, size = 256) {
    return joinPath(platform, home, ".local", "share", "icons", "hicolor", `${size}x${size}`, "apps", `${iconName}.png`);
}
/** `.desktop` quoting: a path with a space or a quote must survive a parser. */
function quoted(value) {
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
export function shortcutText(input) {
    const lines = [
        "[Desktop Entry]",
        "Type=Application",
        `Name=${input.name}`,
        `Comment=Opens ${input.extensions.join(", ") || "documents"} with ${input.name}`,
        `Exec=${quoted(input.executable)} %U`,
        ...(input.iconName === null ? [] : [`Icon=${input.iconName}`]),
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
/**
 * The icon name one app's shortcut uses, for artwork with this content.
 *
 * The content is in the name because a desktop caches an icon **by name**. Rewriting
 * `suite-canvas.png` leaves KDE and GTK drawing the pixmap they already resolved: the file is
 * new, the picture on screen is not, and it stays that way for the session. A name that changes
 * when the bytes change cannot be served from a cache, on any desktop, without asking anyone to
 * log out.
 *
 * `digest` is a short hex hash of the icon's bytes; eight characters is plenty to separate two
 * artworks and short enough to read in a `.desktop` file.
 */
export function shortcutIconName(id, digest) {
    return `suite-${id}-${digest}`;
}
/** The name every earlier build used for one app's icon, which pruning still recognises. */
export function legacyIconName(id) {
    return `suite-${id}`;
}
/**
 * Whether an icon in the apps directory belongs to one app.
 *
 * Matches the unversioned name an older build wrote and every hashed name for this id, and
 * nothing else — `suite-canvas` must not match `suite-canvasfoo`.
 */
export function isIconOf(id, name) {
    if (name === `${legacyIconName(id)}.png`)
        return true;
    return name.startsWith(`${legacyIconName(id)}-`) && name.endsWith(".png");
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
export function wmClassFor(id) {
    return `suite-${id}`;
}
//# sourceMappingURL=shortcuts.js.map