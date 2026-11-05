/**
 * `suite://<app>/<segments…>?<query>` — the one link shape the suite shares.
 *
 * Parsing is deliberately paranoid, because the input arrives from the operating
 * system: a browser, a mail client, or a shortcut file can all hand Start an
 * arbitrary string. Three things are checked before a router sees anything:
 *
 * 1. **The scheme is ours.** No `file:`, no `https:`, nothing protocol-relative.
 * 2. **There is no authority trick.** User info and a port are rejected rather
 *    than ignored, so `suite://canvas@evil.example/x` is an error and not a
 *    request to route to `canvas`.
 * 3. **No segment can climb.** Literal `.` and `..` are rejected, and so is a
 *    percent-encoded one, which the URL parser would otherwise decode into the
 *    same thing after normalising it away.
 *
 * What a segment *means* is the app's business. A segment that names a file is a
 * path the app validates against its own library; the parser only guarantees it
 * is a short string with no separators or control characters.
 */
/** The URL protocol every suite link uses. */
export declare const SUITE_PROTOCOL = "suite://";
/** Apps a hub routes to before it has read any manifest. */
export declare const DEFAULT_APP_IDS: readonly ["start", "canvas", "planner", "budget"];
/** One parsed link, with the app already lower-cased and the segments decoded. */
export interface SuiteDeepLink {
    readonly app: string;
    readonly segments: readonly string[];
    readonly query: Readonly<Record<string, string>>;
}
export type DeepLinkRejection = "not-a-suite-url" | "unknown-app"
/** Credentials or a port in the authority; a routing trick, never a real link. */
 | "credentials-or-port"
/** A fragment on a `suite://` link: nothing defines one yet, and silently dropping it could drop a key. */
 | "fragment-not-supported" | "unsafe-segment" | "too-many-segments";
export type DeepLinkParse = {
    readonly ok: true;
    readonly value: SuiteDeepLink;
} | {
    readonly ok: false;
    readonly reason: DeepLinkRejection;
};
export interface ParseDeepLinkOptions {
    /** The apps this hub knows about. Defaults to the four that ship together. */
    readonly apps?: readonly string[];
}
/**
 * Parse a deep link. The path is read from the raw string as well as the parsed
 * URL, because the URL parser silently normalises `a/../b` to `b` — a link that
 * climbs should be refused, not quietly reinterpreted.
 */
export declare function parseDeepLink(value: string, options?: ParseDeepLinkOptions): DeepLinkParse;
/**
 * The segment that names a workspace, for every app.
 *
 * Naming it here is what lets a link have one shape across the suite instead of
 * each app inventing its own: `suite://canvas/workspace/<id>`,
 * `suite://planner/workspace/<id>`. A link is a deep link, never a foreign key,
 * so an app that is missing is a prompt to install rather than a broken
 * reference.
 */
export declare const WORKSPACE_SEGMENT = "workspace";
/** The link that opens one workspace in an app. */
export declare function workspaceLink(app: string, workspaceId: string): string | null;
/** The prefix an app's links share: `suite://canvas/`. */
export declare function deepLinkPrefix(app: string): string;
/**
 * Build a link, or null when a piece would not survive parsing.
 *
 * Returning null rather than throwing keeps this usable in a render path: a
 * caller with a bad id renders nothing instead of crashing the route.
 */
export declare function formatDeepLink(app: string, segments?: readonly string[], query?: Readonly<Record<string, string>>): string | null;
//# sourceMappingURL=deepLink.d.ts.map