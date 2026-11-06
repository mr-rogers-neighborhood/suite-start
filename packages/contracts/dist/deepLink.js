import { suiteAppIdSchema } from "./appManifest.js";
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
export const SUITE_PROTOCOL = "suite://";
/** Apps a hub routes to before it has read any manifest. */
export const DEFAULT_APP_IDS = ["start", "canvas", "planner", "budget"];
const PROTOCOL_PATTERN = /^suite:\/\//iu;
const MAX_SEGMENTS = 16;
const MAX_SEGMENT_LENGTH = 512;
const MAX_QUERY_ENTRIES = 32;
/** Backslashes, NUL and other control characters: never part of a segment we accept. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are the thing this rejects; a NUL in a link is never legitimate.
const UNSAFE_SEGMENT = /[\\\u0000-\u001f\u007f]/u;
/** The substring between the scheme and the first `?` or `#`, minus the authority. */
function rawPath(value) {
    const withoutScheme = value.replace(PROTOCOL_PATTERN, "");
    const queryStart = withoutScheme.indexOf("?");
    const fragmentStart = withoutScheme.indexOf("#");
    const stops = [queryStart, fragmentStart].filter((index) => index >= 0);
    const stopAt = stops.length > 0 ? Math.min(...stops) : withoutScheme.length;
    const withoutSuffix = withoutScheme.slice(0, stopAt);
    const firstSlash = withoutSuffix.indexOf("/");
    return firstSlash < 0 ? "" : withoutSuffix.slice(firstSlash + 1);
}
function readQuery(searchParams) {
    const query = {};
    let entries = 0;
    for (const [key, value] of searchParams) {
        entries += 1;
        if (entries > MAX_QUERY_ENTRIES)
            return null;
        // First value wins: a repeated key is a caller bug, not a merge.
        if (!(key in query))
            query[key] = value;
    }
    return query;
}
/**
 * Parse a deep link. The path is read from the raw string as well as the parsed
 * URL, because the URL parser silently normalises `a/../b` to `b` — a link that
 * climbs should be refused, not quietly reinterpreted.
 */
export function parseDeepLink(value, options = {}) {
    const trimmed = value.trim();
    if (!PROTOCOL_PATTERN.test(trimmed))
        return { ok: false, reason: "not-a-suite-url" };
    let url;
    try {
        url = new URL(trimmed);
    }
    catch {
        return { ok: false, reason: "not-a-suite-url" };
    }
    if (url.protocol !== "suite:")
        return { ok: false, reason: "not-a-suite-url" };
    if (url.username !== "" || url.password !== "" || url.port !== "") {
        return { ok: false, reason: "credentials-or-port" };
    }
    if (url.hash !== "")
        return { ok: false, reason: "fragment-not-supported" };
    // Opaque hosts keep their case, so the app id is normalised here.
    const app = url.hostname.toLowerCase();
    const known = options.apps ?? DEFAULT_APP_IDS;
    if (app === "" || !known.includes(app))
        return { ok: false, reason: "unknown-app" };
    const segments = [];
    for (const raw of rawPath(trimmed).split("/")) {
        // An empty piece is a doubled or trailing slash; neither names anything.
        if (raw === "")
            continue;
        let segment;
        try {
            segment = decodeURIComponent(raw);
        }
        catch {
            return { ok: false, reason: "unsafe-segment" };
        }
        if (segment === "." || segment === "..")
            return { ok: false, reason: "unsafe-segment" };
        if (segment.length > MAX_SEGMENT_LENGTH)
            return { ok: false, reason: "unsafe-segment" };
        if (UNSAFE_SEGMENT.test(segment))
            return { ok: false, reason: "unsafe-segment" };
        segments.push(segment);
    }
    if (segments.length > MAX_SEGMENTS)
        return { ok: false, reason: "too-many-segments" };
    const query = readQuery(url.searchParams);
    if (query === null)
        return { ok: false, reason: "too-many-segments" };
    return { ok: true, value: { app, segments, query } };
}
/**
 * The segment that names a workspace, for every app.
 *
 * Naming it here is what lets a link have one shape across the suite instead of
 * each app inventing its own: `suite://canvas/workspace/<id>`,
 * `suite://planner/workspace/<id>`. A link is a deep link, never a foreign key,
 * so an app that is missing is a prompt to install rather than a broken
 * reference.
 */
export const WORKSPACE_SEGMENT = "workspace";
/**
 * The link that opens one workspace in an app.
 *
 * `name` is the document's file name inside the app's documents folder, which is
 * the suite's only document identity: `suite://planner/workspace/2026-Q4.planner`.
 * Naming the file rather than an opaque id is what makes a link resolvable on a
 * machine the hub has never seen, and what lets the hub build one from its own
 * index without owning the document.
 */
export function workspaceLink(app, name) {
    return formatDeepLink(app, [WORKSPACE_SEGMENT, name]);
}
/**
 * The document a workspace link names, or null when it is not one.
 *
 * The inverse of `workspaceLink`, and the only reading of the shape an app has to
 * agree on: exactly `workspace/<name>`, for this app. The name is returned as it
 * was written; whether it names a file this app has is the app's question,
 * because the extension is the app's own.
 *
 * A link carrying a query is refused rather than half honoured: a query would
 * name a view inside the document, and no app implements one yet.
 */
export function workspaceTarget(link, app) {
    const parsed = parseDeepLink(link, { apps: [app] });
    if (!parsed.ok)
        return null;
    const [segment, name, ...rest] = parsed.value.segments;
    if (segment !== WORKSPACE_SEGMENT || name === undefined || rest.length > 0)
        return null;
    if (Object.keys(parsed.value.query).length > 0)
        return null;
    return name;
}
/** The prefix an app's links share: `suite://canvas/`. */
export function deepLinkPrefix(app) {
    return `${SUITE_PROTOCOL}${app}/`;
}
/**
 * Build a link, or null when a piece would not survive parsing.
 *
 * Returning null rather than throwing keeps this usable in a render path: a
 * caller with a bad id renders nothing instead of crashing the route.
 */
export function formatDeepLink(app, segments = [], query = {}) {
    if (!suiteAppIdSchema.safeParse(app).success)
        return null;
    if (segments.length > MAX_SEGMENTS)
        return null;
    const encoded = [];
    for (const segment of segments) {
        if (segment === "" || segment === "." || segment === "..")
            return null;
        if (segment.length > MAX_SEGMENT_LENGTH)
            return null;
        if (UNSAFE_SEGMENT.test(segment) || segment.includes("/"))
            return null;
        encoded.push(encodeURIComponent(segment));
    }
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
        search.append(key, value);
    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    return `${deepLinkPrefix(app)}${encoded.join("/")}${suffix}`;
}
//# sourceMappingURL=deepLink.js.map