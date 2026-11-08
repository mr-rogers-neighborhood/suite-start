/**
 * Where an app's **menu** icon comes from.
 *
 * This is not the same source as the window icon (`windowIcon.ts`), and conflating the two
 * shipped a real bug: every entry pointed at `Icon=suite-<id>` but the file that name
 * resolved to was the hub's own mark, copied once per app. Three names, one image.
 *
 * The artwork comes from the app, not from us: `make-app-icons.py` renders each app's own
 * `icon.svg` into `build/app-icons/<id>.png` at build time, and `extraResources` puts that
 * folder beside the asar. A packaged build reads the copy; a dev run reads the source tree.
 *
 * Null means "this build has no artwork for that app" — the caller writes no icon rather
 * than writing the wrong one. A generic menu icon is an honest gap; the hub's mark on
 * somebody else's app is not.
 */
export interface AppIconOptions {
    readonly id: string;
    readonly isPackaged: boolean;
    readonly resourcesPath: string;
    /** The app's own directory, `app.getAppPath()`. */
    readonly appPath: string;
    /** Injected so the rule is a test rather than a disk. */
    readonly exists?: (path: string) => boolean;
}
export declare function resolveAppIcon(options: AppIconOptions): string | null;
//# sourceMappingURL=appIconFile.d.ts.map