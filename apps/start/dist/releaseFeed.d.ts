import { SUITE_UPDATE_STATE_FILE } from "@suite/contracts";
/**
 * Reading an app's release feed, on demand.
 *
 * The hub used to read a catalog and called it an update check. It reads the same
 * file the app's own updater reads, from the base URL the app's manifest names, so
 * the two cannot disagree about what is newest. Nothing here writes, downloads or
 * replaces anything: a check is one GET per app, and only when a person asks.
 */
/** The file `electron-updater` looks for, by platform. */
export declare function feedFileFor(platform: string): string;
/**
 * The version a feed file names.
 *
 * The file is YAML, and the hub needs one scalar from it. Parsing the whole
 * document would be a dependency for a line that `electron-updater` writes as
 * `version: 0.5.0` at the top level; this reads exactly that, and returns null
 * rather than guessing when the file is not the shape expected.
 */
export declare function versionFromFeed(text: string): string | null;
export interface FeedCheck {
    /** The version the feed offers, or null when it could not be read. */
    readonly version: string | null;
    /** Why it could not be read, when it could not. */
    readonly reason: string | null;
    /** When this check ran, ISO-8601. */
    readonly checkedAt: string;
}
export type FeedFetch = (url: string) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}>;
/** Read one app's feed, or say why not. */
export declare function checkFeed(feed: string, platform: string, fetch: FeedFetch, now?: () => Date): Promise<FeedCheck>;
/** Where an app keeps the report it writes. Unused here, re-exported for the reader beside it. */
export { SUITE_UPDATE_STATE_FILE };
//# sourceMappingURL=releaseFeed.d.ts.map