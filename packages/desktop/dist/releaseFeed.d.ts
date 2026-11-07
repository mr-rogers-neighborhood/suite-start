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
/** The file a feed offers, as the manifest names it. */
export interface FeedArtifact {
    /**
     * The file's name as published.
     *
     * Never a path: a feed names one file beside itself, and a name carrying a
     * separator or a traversal would be a feed trying to write somewhere else. A
     * value like that is refused rather than resolved.
     */
    readonly path: string;
    /** Base64 SHA-512 of the file's bytes, exactly as `electron-builder` writes it. */
    readonly sha512: string;
    /** Bytes, for a progress bar. Null when the feed did not say. */
    readonly size: number | null;
}
/**
 * The artifact a feed offers: the file an install would download.
 *
 * `electron-builder` writes the artifact twice — once in `files:` with its size,
 * and once as the top-level `path:`/`sha512:` pair — and a feed may list more than
 * one entry (a `.blockmap` rides along for some targets). The top-level pair is the
 * primary file, so it wins; the block map never does. Returning null rather than
 * guessing is the same rule `versionFromFeed` follows: a caller installs what the
 * manifest named, or it installs nothing.
 */
export declare function artifactFromFeed(text: string): FeedArtifact | null;
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
    /**
     * The artifact the **verified** manifest names, when it named one.
     *
     * Parsed from the same bytes the signature covered, so an install never fetches
     * the manifest twice and can never compare a download against a second, unverified
     * copy of what was asked for. Null when the manifest named no artifact.
     */
    readonly artifact: FeedArtifact | null;
}
/**
 * Read one app's feed, and refuse a manifest the publisher did not sign.
 *
 * The signature is over the manifest **exactly as served**: normalising it first
 * would verify a file nobody was given. A feed that answers, but with an unsigned or
 * tampered manifest, is the case this exists for, so it is reported rather than
 * treated as "no update".
 *
 * This is also the only place a product build reads the network on behalf of an app.
 * The app hands in a feed and receives an answer; it never holds the capability
 * itself, which is what lets an app repository assert that its own code makes no
 * network calls.
 */
export declare function checkSignedFeed(feed: string, platform: string, fetchFeed?: FeedFetch, now?: () => Date, 
/** Overridable so a test can prove the accepting path without the publisher's key. */
publicKey?: string): Promise<FeedCheck>;
//# sourceMappingURL=releaseFeed.d.ts.map