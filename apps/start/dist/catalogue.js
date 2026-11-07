import { compareSemver, parseSemver, SUITE_APPS, } from "@suite/contracts";
import { checkSignedFeed } from "@suite/desktop";
/** The hub's own id. It is not one of the apps the hub lists. */
export const SELF_ID = "start";
/**
 * The three document apps.
 *
 * Every field here mirrors that app's own `suite.app.json` and `electron-builder.yml`:
 * the id, the name, the extension, the capabilities, the channel and the feed. A test
 * cannot read a sibling checkout, so it checks what can be checked — that the ids,
 * folders and extensions agree with `SUITE_APPS` — and this comment carries the rest.
 *
 * Start writes these into the manifest an install leaves behind, because an AppImage
 * carries its own copy inside the image where nothing can read it without unpacking.
 * The version in that manifest comes from the signed feed, never from here.
 */
export const CATALOGUE_APPS = [
    {
        id: "canvas",
        name: "Suite Canvas",
        folder: "Canvas",
        extensions: ["canvas"],
        capabilities: ["document.file", "sync", "attachments", "publish"],
        feed: "https://github.com/mr-rogers-neighborhood/suite-canvas/releases/latest/download",
        channel: "alpha",
    },
    {
        id: "planner",
        name: "Suite Planner",
        folder: "Planner",
        extensions: ["planner"],
        capabilities: ["document.file"],
        feed: "https://github.com/mr-rogers-neighborhood/suite-planner/releases/latest/download",
        channel: "alpha",
    },
    {
        id: "budget",
        name: "Suite Budget",
        folder: "Budget",
        extensions: ["budget"],
        capabilities: ["document.file"],
        feed: "https://github.com/mr-rogers-neighborhood/suite-budget/releases/latest/download",
        channel: "alpha",
    },
];
/** Whether the catalogue still says the same thing `SUITE_APPS` does. */
export function catalogueMatchesContracts() {
    return CATALOGUE_APPS.flatMap((entry) => {
        const contract = SUITE_APPS.find((app) => app.id === entry.id);
        if (contract === undefined)
            return [`${entry.id} is not in SUITE_APPS`];
        const problems = [];
        if (contract.folder !== entry.folder)
            problems.push(`${entry.id} folder`);
        if (contract.extension !== entry.extensions[0])
            problems.push(`${entry.id} extension`);
        return problems;
    });
}
/** The hub's own row: a name and a channel, with its feed supplied by the build. */
export const SELF_ENTRY = {
    id: SELF_ID,
    name: "Suite Start",
    folder: "Start",
    extensions: [],
    capabilities: [],
    feed: "",
    channel: "alpha",
    releases: "https://github.com/mr-rogers-neighborhood/suite-start/releases/latest",
};
/**
 * The feed to read for one entry.
 *
 * A base replaces the whole URL rather than a prefix: a local release folder holds one
 * folder per app, and rewriting a GitHub path would describe a server that does not exist.
 */
export function feedFor(entry, feedBase) {
    const base = feedBase?.trim().replace(/\/+$/u, "");
    if (base !== undefined && base.length > 0)
        return `${base}/${entry.id}`;
    return entry.feed.length > 0 ? entry.feed : null;
}
/** Whether `available` is a later version than `installed`. Unparseable versions are not. */
export function isNewer(available, installed) {
    if (available === null || installed === null)
        return false;
    const left = parseSemver(available);
    const right = parseSemver(installed);
    if (left === null || right === null)
        return false;
    return compareSemver(left, right) > 0;
}
/** Read one entry's feed and pair it with what is installed. */
async function readEntry(entry, options) {
    const installed = options.installed.get(entry.id) ?? null;
    const feed = feedFor(entry, options.feedBase);
    if (feed === null) {
        return {
            ...entry,
            feed: "",
            available: null,
            reason: "this build was packaged without a feed",
            installed,
            newer: false,
            artifact: null,
        };
    }
    const check = await checkSignedFeed(feed, options.platform ?? process.platform, options.fetch, options.now, options.publicKey);
    return {
        ...entry,
        feed,
        available: check.verified ? check.version : null,
        reason: check.verified ? null : (check.reason ?? "the feed could not be verified"),
        installed,
        newer: check.verified ? isNewer(check.version, installed) : false,
        artifact: check.verified ? check.artifact : null,
    };
}
/**
 * The catalogue after one install: the new version, and nothing else re-read.
 *
 * A feed answer is still the answer from the last check, so this refetches nothing and
 * claims nothing: it only records what is now on disk.
 */
export function withInstalled(catalogue, id, version) {
    return catalogue.map((entry) => entry.id === id
        ? { ...entry, installed: version, newer: isNewer(entry.available, version) }
        : entry);
}
/**
 * Every app the suite offers, each with what is installed and what is offered.
 *
 * The hub's own row is included, and always last: it cannot replace its own running
 * binary, so it is shown as a fact rather than as a button.
 */
export async function readCatalogue(options) {
    const apps = await Promise.all(CATALOGUE_APPS.map((entry) => readEntry(entry, options)));
    const self = await readEntry({ ...SELF_ENTRY, feed: options.selfFeed ?? "" }, options);
    return [...apps, self];
}
//# sourceMappingURL=catalogue.js.map