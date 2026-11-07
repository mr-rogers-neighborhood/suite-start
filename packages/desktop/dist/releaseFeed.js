import { decodeSignature, SUITE_UPDATE_PUBLIC_KEY, UPDATE_SIGNATURE_SUFFIX, verifyUpdateManifest, } from "./updateSignature.js";
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
export function feedFileFor(platform) {
    if (platform === "darwin")
        return "latest-mac.yml";
    if (platform === "win32")
        return "latest.yml";
    return "latest-linux.yml";
}
/**
 * The version a feed file names.
 *
 * The file is YAML, and a caller needs one scalar from it. Parsing the document
 * would be a dependency for a line `electron-updater` writes as `version: 0.5.0` at
 * the top level; this reads exactly that and returns null rather than guessing.
 */
export function versionFromFeed(text) {
    for (const line of text.split(/\r?\n/u)) {
        const match = /^version:\s*(.+?)\s*$/u.exec(line);
        if (match?.[1] !== undefined) {
            const value = match[1].replace(/^["']|["']$/gu, "");
            return value.length > 0 ? value : null;
        }
    }
    return null;
}
/** The feed's base URL, as `electron-updater` records it beside a packaged app. */
export function feedUrlFromAppUpdateYml(text) {
    for (const line of text.split(/\r?\n/u)) {
        const match = /^url:\s*(.+?)\s*$/u.exec(line);
        if (match?.[1] !== undefined) {
            const value = match[1].replace(/^["']|["']$/gu, "");
            return value.length > 0 ? value : null;
        }
    }
    return null;
}
const UNSAFE_FILENAME = /[\\/\0]/u;
function scalar(value) {
    return value.replace(/^["']|["']$/gu, "").trim();
}
function field(line) {
    const match = /^\s*(?:-\s+)?([A-Za-z][\w-]*):\s*(.*)$/u.exec(line);
    if (match?.[1] === undefined)
        return null;
    return { key: match[1], value: scalar(match[2] ?? "") };
}
/** The `files:` block and the top-level `path:`/`sha512:`, as a plain read of the shape. */
function readFeedFiles(text) {
    const entries = [];
    let path = null;
    let sha512 = null;
    let inFiles = false;
    for (const line of text.split(/\r?\n/u)) {
        // An unindented line is a top-level key, and the first one after `files:`
        // ends the block.
        if (/^\S/u.test(line)) {
            const top = field(line);
            inFiles = top?.key === "files" && top.value.length === 0;
            if (top?.key === "path" && top.value.length > 0)
                path = top.value;
            if (top?.key === "sha512" && top.value.length > 0)
                sha512 = top.value;
            continue;
        }
        if (!inFiles)
            continue;
        const isNewItem = /^\s*-\s+/u.test(line);
        if (isNewItem)
            entries.push({ url: "", sha512: null, size: null });
        const current = entries.at(-1);
        if (current === undefined)
            continue;
        const found = field(line);
        if (found?.key === "url")
            current.url = found.value;
        else if (found?.key === "sha512")
            current.sha512 = found.value;
        else if (found?.key === "size") {
            const bytes = Number.parseInt(found.value, 10);
            current.size = Number.isFinite(bytes) ? bytes : null;
        }
    }
    return { entries, path, sha512 };
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
export function artifactFromFeed(text) {
    const { entries, path: declared, sha512: declaredSha } = readFeedFiles(text);
    const declaredEntry = declared === null ? undefined : entries.find((entry) => entry.url === declared);
    const chosen = declaredEntry ?? entries.find((entry) => !entry.url.endsWith(".blockmap")) ?? entries[0];
    const path = declared ?? chosen?.url ?? null;
    const sha512 = declaredSha ?? chosen?.sha512 ?? null;
    if (path === null || sha512 === null)
        return null;
    if (path === "." || path === ".." || path.endsWith(".blockmap"))
        return null;
    if (UNSAFE_FILENAME.test(path))
        return null;
    return { path, sha512, size: chosen?.size ?? null };
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
export async function checkSignedFeed(feed, platform, fetchFeed, now = () => new Date(), 
/** Overridable so a test can prove the accepting path without the publisher's key. */
publicKey = SUITE_UPDATE_PUBLIC_KEY) {
    const fetch = fetchFeed ?? ((url) => globalThis.fetch(url));
    const checkedAt = now().toISOString();
    const base = feed.replace(/\/+$/u, "");
    const file = feedFileFor(platform);
    const fail = (reason) => ({
        version: null,
        reason,
        checkedAt,
        verified: false,
        artifact: null,
    });
    try {
        const manifest = await fetch(`${base}/${file}`);
        if (!manifest.ok)
            return fail(`the feed answered ${manifest.status}`);
        const signatureResponse = await fetch(`${base}/${file}${UPDATE_SIGNATURE_SUFFIX}`);
        if (!signatureResponse.ok) {
            return fail("the feed published no signature, so the manifest cannot be trusted");
        }
        const body = await manifest.text();
        const signature = decodeSignature(await signatureResponse.text());
        if (!verifyUpdateManifest(new TextEncoder().encode(body), signature, publicKey)) {
            return fail("the manifest is not signed by the publisher");
        }
        const version = versionFromFeed(body);
        if (version === null)
            return fail("the feed named no version");
        return {
            version,
            reason: null,
            checkedAt,
            verified: true,
            artifact: artifactFromFeed(body),
        };
    }
    catch {
        return fail("the feed could not be reached");
    }
}
//# sourceMappingURL=releaseFeed.js.map