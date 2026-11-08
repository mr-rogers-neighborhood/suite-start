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
    /**
     * The icon name a theme lookup uses, without a size or extension.
     *
     * Null when this build has no artwork for the app: the entry then carries no `Icon=` line
     * rather than naming a file that is not there.
     */
    readonly iconName: string | null;
}
/** The entry's file name, which is also how it is found again. */
export declare function shortcutFilename(id: string): string;
/** Where one app's entry lives under a user's data directory. */
export declare function shortcutPath(platform: string, home: string, id: string): string;
/**
 * Where the icon a shortcut points at is installed.
 *
 * The theme directory rather than a bare path, so a panel that asks for a size finds the
 * closest one instead of scaling a file it was handed.
 */
export declare function shortcutIconPath(platform: string, home: string, iconName: string, size?: number): string;
/**
 * One `[Desktop Entry]` section.
 *
 * `StartupWMClass` is the app's own name because that is what an Electron window reports
 * on X11 when it declares no `desktopName` of its own; a panel uses it to group the window
 * under this entry instead of drawing a second, generic icon.
 */
export declare function shortcutText(input: ShortcutInput): string;
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
export declare function shortcutIconName(id: string, digest: string): string;
/** The name every earlier build used for one app's icon, which pruning still recognises. */
export declare function legacyIconName(id: string): string;
/**
 * Whether an icon in the apps directory belongs to one app.
 *
 * Matches the unversioned name an older build wrote and every hashed name for this id, and
 * nothing else — `suite-canvas` must not match `suite-canvasfoo`.
 */
export declare function isIconOf(id: string, name: string): boolean;
/**
 * The `WM_CLASS` a bundled app actually reports.
 *
 * Measured, not assumed. The installed Canvas AppImage announces
 * `WM_CLASS(STRING) = "suite-canvas", "Suite-canvas"` — the `executableName` its
 * `electron-builder.yml` sets, which is `suite-` plus the app id, not the product name and
 * not the versioned file name. An entry claiming `Suite Canvas` matches no window, so a
 * panel cannot group the running app under it and draws it on its own.
 */
export declare function wmClassFor(id: string): string;
//# sourceMappingURL=shortcuts.d.ts.map