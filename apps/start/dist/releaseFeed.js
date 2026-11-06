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
 * The file is YAML, and the hub needs one scalar from it. Parsing the whole
 * document would be a dependency for a line that `electron-updater` writes as
 * `version: 0.5.0` at the top level; this reads exactly that, and returns null
 * rather than guessing when the file is not the shape expected.
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
/** Read one app's feed, or say why not. */
export async function checkFeed(feed, platform, fetch, now = () => new Date()) {
    const checkedAt = now().toISOString();
    const url = `${feed.replace(/\/+$/u, "")}/${feedFileFor(platform)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return { version: null, reason: `the feed answered ${response.status}`, checkedAt };
        }
        const version = versionFromFeed(await response.text());
        return version === null
            ? { version: null, reason: "the feed named no version", checkedAt }
            : { version, reason: null, checkedAt };
    }
    catch {
        return { version: null, reason: "the feed could not be reached", checkedAt };
    }
}
/** Where an app keeps the report it writes. Unused here, re-exported for the reader beside it. */
export { SUITE_UPDATE_STATE_FILE };
//# sourceMappingURL=releaseFeed.js.map