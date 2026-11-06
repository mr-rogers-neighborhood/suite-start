import { type SuiteReleaseChannel, type SuiteUpdateState } from "@suite/contracts";
import { type FeedFetch } from "@suite/desktop";
/**
 * The app's own update check, and the report it leaves behind.
 *
 * The app owns its bytes and its feed: it is the only process that may replace this
 * binary. The hub reads the report this writes rather than asking a feed of its own,
 * so the two cannot disagree about what is newest.
 *
 * **The manifest is verified before anything else happens.** An update feed is one
 * URL, and anything that can answer it can offer a version; the artifact's sha512
 * protects a download, not the manifest that named it. A feed that answers without a
 * signature from the publisher is refused, and the app never asks its updater to act
 * on it.
 *
 * `electron-updater` is imported on demand, and only in a packaged build: a checkout
 * has no feed, and a dev run must not try to replace itself.
 */
export interface UpdateCheckOptions {
    /** The app's machine-local state directory; the report is written here. */
    readonly dataDir: string;
    readonly version: string;
    readonly channel: SuiteReleaseChannel;
    /** False in a dev run, which has no `app-update.yml` to read. */
    readonly packaged: boolean;
    /** Where `app-update.yml` lives. Defaults to the packaged resources directory. */
    readonly resourcesPath?: string;
    /** A feed to read instead of the recorded one. Tests use this. */
    readonly feed?: string;
    readonly updater?: UpdaterLike;
    readonly fetch?: FeedFetch;
    readonly platform?: string;
    readonly now?: () => Date;
}
/** The part of `electron-updater` this module uses. */
export interface UpdaterLike {
    /** Set before the check: an app must never download a binary nobody asked for. */
    autoDownload: boolean;
    checkForUpdates(): Promise<{
        updateInfo: {
            version: string;
        };
    } | null>;
}
export interface UpdateCheckResult {
    readonly state: SuiteUpdateState | null;
    readonly error: string | null;
    /** True only when the manifest that produced this answer was signed by the publisher. */
    readonly verified: boolean;
}
/** Ask the feed once, write the report, and say what happened. */
export declare function checkForUpdates(options: UpdateCheckOptions): Promise<UpdateCheckResult>;
/** The report's path inside an app's data directory. */
export declare function reportPath(dataDir: string): string;
/** Write the report the hub reads. Failure is logged, never thrown: a report is a courtesy. */
export declare function writeReport(dataDir: string, state: SuiteUpdateState): Promise<void>;
//# sourceMappingURL=updateCheck.d.ts.map