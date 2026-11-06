import { type SuiteReleaseChannel, type SuiteUpdateState } from "@suite/contracts";
/**
 * The app's own update check, and the report it leaves behind.
 *
 * The app owns its bytes and its feed: it is the only process that may replace
 * this binary. The hub reads the report this writes rather than asking a feed of
 * its own, so the two can never disagree about what is newest, and a person who
 * opens the hub on a machine whose apps have not run in weeks still gets a
 * timestamped answer.
 *
 * `electron-updater` is imported on demand, and only in a packaged build with an
 * update config beside it: a checkout has no feed, and a dev run must not try to
 * replace itself.
 */
export interface UpdateCheckOptions {
    /** The app's machine-local state directory; the report is written here. */
    readonly dataDir: string;
    readonly version: string;
    readonly channel: SuiteReleaseChannel;
    /** False in a dev run, which has no `app-update.yml` to read. */
    readonly packaged: boolean;
    /** Overridable for a test, which must not spawn an updater. */
    readonly updater?: UpdaterLike;
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
    readonly state: SuiteUpdateState;
    readonly error: string | null;
}
/** Ask the feed once, write the report, and say what happened. */
export declare function checkForUpdates(options: UpdateCheckOptions): Promise<UpdateCheckResult>;
/** The report's path inside an app's data directory. */
export declare function reportPath(dataDir: string): string;
/** Write the report the hub reads. Failure is logged, never thrown: a report is a courtesy. */
export declare function writeReport(dataDir: string, state: SuiteUpdateState): Promise<void>;
//# sourceMappingURL=updateCheck.d.ts.map