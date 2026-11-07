/**
 * Where the window icon comes from.
 *
 * Two different icons belong to one app, and they are not the same source. A desktop entry
 * is drawn from the hicolor theme using the name its `.desktop` file declares; a running
 * window's taskbar icon is `_NET_WM_ICON`, which Chromium fills from `BrowserWindow({ icon })`
 * and falls back to Electron's own logo when that option is missing. Missing it is why a
 * packaged hub showed the suite's mark in the menu and Electron's in the dock.
 *
 * A packaged build reads the copy `extraResources` puts beside the asar; a dev run reads the
 * source tree, which is the same file.
 */
export interface WindowIconOptions {
    readonly isPackaged: boolean;
    readonly resourcesPath: string;
    /** The app's own directory, `app.getAppPath()`. */
    readonly appPath: string;
    /** Injected so the rule is a test rather than a disk. */
    readonly exists?: (path: string) => boolean;
}
export interface WindowIcon {
    readonly path: string;
    readonly reason: string | null;
}
/**
 * The icon path, or null when this build has none.
 *
 * Null rather than a guess: passing a path that does not exist is the same as passing
 * nothing, minus the honesty. The two builds read from different places because they can
 * — a packaged app has no source tree, and a dev run has no `resources` directory.
 */
export declare function resolveWindowIcon(options: WindowIconOptions): WindowIcon | null;
//# sourceMappingURL=windowIcon.d.ts.map