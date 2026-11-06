/**
 * Reading a signed release feed.
 *
 * One implementation for the hub and for the apps, because they must agree about
 * what is newest: the hub reads the file to show a version, and the app reads it to
 * decide whether to update itself. A second parser is a second opinion.
 *
 * Nothing here writes, downloads an artifact or replaces anything.
 */
/** The file `electron-updater` looks for, by platform. */
export declare function feedFileFor(platform: string): string;
/**
 * The version a feed file names.
 *
 * The file is YAML, and a caller needs one scalar from it. Parsing the document
 * would be a dependency for a line `electron-updater` writes as `version: 0.5.0` at
 * the top level; this reads exactly that and returns null rather than guessing.
 */
export declare function versionFromFeed(text: string): string | null;
/** The feed's base URL, as `electron-updater` records it beside a packaged app. */
export declare function feedUrlFromAppUpdateYml(text: string): string | null;
export interface FeedResponse {
    readonly ok: boolean;
    readonly status: number;
    text(): Promise<string>;
}
export type FeedFetch = (url: string) => Promise<FeedResponse>;
export interface FeedCheck {
    /** The version the feed offers, or null when it could not be read or did not verify. */
    readonly version: string | null;
    /** Why it is null, in words a surface can show. */
    readonly reason: string | null;
    /** When this check ran, ISO-8601. */
    readonly checkedAt: string;
    /** True only when a signature over the served bytes verified. */
    readonly verified: boolean;
}
/**
 * Read one app's feed, and refuse a manifest the publisher did not sign.
 *
 * The signature is over the manifest **exactly as served**: normalising it first
 * would verify a file nobody was given. A feed that answers, but with an unsigned or
 * tampered manifest, is the case this exists for, so it is reported rather than
 * treated as "no update".
 */
export declare function checkSignedFeed(feed: string, platform: string, fetch: FeedFetch, now?: () => Date, 
/** Overridable so a test can prove the accepting path without the publisher's key. */
publicKey?: string): Promise<FeedCheck>;
//# sourceMappingURL=releaseFeed.d.ts.map