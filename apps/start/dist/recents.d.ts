/**
 * Start's own recent-files list.
 *
 * It belongs to Start rather than to an app, because it spans them: "the thing I
 * opened last" is a hub question. Each app keeps its own library and its own
 * recents; this is a second list, not the same one, and nothing reconciles them,
 * so no party can overwrite another's idea of history.
 *
 * The file is a cache of convenience. A missing or unreadable one is an empty
 * list, never an error, because a launcher that will not start over its own
 * history is worse than one that has forgotten it.
 */
export interface RecentEntry {
    /** Absolute path of the file that was opened. */
    readonly path: string;
    /** The app it opened in, so a missing app can be named rather than guessed. */
    readonly appId: string;
    readonly openedAt: number;
}
/** How many entries Start keeps. Enough to see a week of work, short enough to scan. */
export declare const RECENT_LIMIT = 20;
export interface RecentsFile {
    readonly path: string;
    list(): Promise<readonly RecentEntry[]>;
    remember(entry: Omit<RecentEntry, "openedAt">): Promise<void>;
    forget(path: string): Promise<void>;
}
export declare function recentsFile(dataDirectory: string): RecentsFile;
//# sourceMappingURL=recents.d.ts.map