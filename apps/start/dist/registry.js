import { describeIssues, manifestFitsHub, parseAppManifest } from "@suite/contracts";
/**
 * What is installed, and what may be launched.
 *
 * Two records make one app:
 *
 * - the **manifest** (`suite.app.json`), which the app ships and signs, and which
 *   says what it is, what files it opens, and which contract it expects;
 * - the **install record**, which Start writes when it installs something, and
 *   which is the only place an executable path lives.
 *
 * Keeping them apart is the point. A manifest is data that arrives from the app;
 * nothing in it may name a binary, so a tampered manifest cannot redirect a
 * launch. Discovery joins the two and refuses anything that does not line up.
 *
 * The filesystem is a port, so discovery is a test rather than a fixture
 * directory: `readText` and `listDirectories` are all it needs.
 */
/** Name a packaged app ships beside its own executable resources. */
export const APP_MANIFEST_FILENAME = "suite.app.json";
const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:[\\/])/u;
function joinPath(root, child) {
    return root.endsWith("/") ? `${root}${child}` : `${root}/${child}`;
}
function recordFor(records, id) {
    return records.find((record) => record.id === id) ?? null;
}
async function readManifest(fileSystem, manifestPath) {
    let text;
    try {
        text = await fileSystem.readText(manifestPath);
    }
    catch {
        // A directory without a manifest is not an app, so it is not a rejection
        // worth reporting either.
        return { path: manifestPath, reason: "no manifest" };
    }
    let value;
    try {
        value = JSON.parse(text);
    }
    catch {
        return { path: manifestPath, reason: "the manifest is not JSON" };
    }
    const parsed = parseAppManifest(value);
    if (!parsed.ok)
        return { path: manifestPath, reason: describeIssues(parsed.issues) };
    return parsed.value;
}
function isRejection(value) {
    return "reason" in value;
}
/**
 * Read every manifest under the roots and pair it with its install record.
 *
 * Rejections are collected rather than thrown: one broken install must not stop
 * the launcher from starting the other two. Duplicate ids keep the first and
 * report the rest, so a stale second install is visible instead of silent.
 */
export async function discoverApps(options) {
    const apps = [];
    const rejected = [];
    const seen = new Set();
    // A record that names its own manifest is read first: it is the app the user
    // just added, and it does not depend on a directory layout.
    const fromRecords = options.records.flatMap((record) => record.manifestPath === undefined ? [] : [record.manifestPath]);
    const fromRoots = [];
    for (const root of options.roots) {
        let children;
        try {
            children = await options.fileSystem.listDirectories(root);
        }
        catch {
            // A root that does not exist yet is normal on a fresh machine.
            continue;
        }
        for (const child of children) {
            fromRoots.push(joinPath(joinPath(root, child), APP_MANIFEST_FILENAME));
        }
    }
    const candidates = [...fromRecords, ...fromRoots];
    for (const manifestPath of candidates) {
        const found = await readManifest(options.fileSystem, manifestPath);
        if (isRejection(found)) {
            if (found.reason !== "no manifest")
                rejected.push(found);
            continue;
        }
        if (!manifestFitsHub(found, options.hubContract)) {
            rejected.push({
                path: manifestPath,
                reason: `needs contract ${found.contractVersion}, which is newer than this launcher`,
            });
            continue;
        }
        if (seen.has(found.id)) {
            rejected.push({ path: manifestPath, reason: `duplicate install of ${found.id}` });
            continue;
        }
        const record = recordFor(options.records, found.id);
        if (!record) {
            rejected.push({ path: manifestPath, reason: `no install record for ${found.id}` });
            continue;
        }
        if (!ABSOLUTE_PATH.test(record.executable)) {
            rejected.push({
                path: manifestPath,
                reason: "the install record names a relative executable",
                id: found.id,
            });
            continue;
        }
        // An install whose executable was moved or uninstalled is not an app the
        // hub can launch, and a card with a dead Open button is worse than a card
        // that says what is wrong.
        if (!(await options.fileSystem.exists(record.executable))) {
            rejected.push({
                path: manifestPath,
                reason: "the executable this install names is not there",
                id: found.id,
            });
            continue;
        }
        seen.add(found.id);
        apps.push({
            manifest: found,
            manifestPath,
            executable: record.executable,
            installedAt: record.installedAt ?? null,
        });
    }
    return { apps, rejected };
}
/** The app that claims a file extension, if any. */
export function appForExtension(apps, extension) {
    const wanted = extension.toLowerCase();
    return apps.find((app) => app.manifest.fileExtensions.includes(wanted)) ?? null;
}
/** The app with this id, if installed. */
export function appById(apps, id) {
    return apps.find((app) => app.manifest.id === id) ?? null;
}
//# sourceMappingURL=registry.js.map