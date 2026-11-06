import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SUITE_UPDATE_STATE_FILE, updateAvailable, } from "@suite/contracts";
import { checkSignedFeed, feedUrlFromAppUpdateYml } from "@suite/desktop";
/** Ask the feed once, write the report, and say what happened. */
export async function checkForUpdates(options) {
    const now = options.now ?? (() => new Date());
    const platform = options.platform ?? process.platform;
    const feed = options.feed ?? (await recordedFeed(options));
    if (feed === null) {
        return { state: null, error: "this build has no update feed", verified: false };
    }
    const check = await checkSignedFeed(feed, platform, options.fetch, now);
    if (!check.verified || check.version === null) {
        // No report: a card that says "checked" would be claiming an answer nobody gave.
        return {
            state: null,
            error: check.reason ?? "the feed could not be verified",
            verified: false,
        };
    }
    const state = {
        format: "suite.update-state",
        version: options.version,
        available: updateAvailable({
            format: "suite.update-state",
            version: options.version,
            available: check.version,
            checkedAt: check.checkedAt,
            channel: options.channel,
        })
            ? check.version
            : null,
        checkedAt: check.checkedAt,
        channel: options.channel,
    };
    // The version came from the verified manifest, so the download has something
    // trustworthy to compare against. The updater still verifies the artifact's hash.
    const updater = options.updater ?? (await loadUpdater());
    if (updater !== null && state.available !== null) {
        updater.autoDownload = false;
        await updater.checkForUpdates().catch((error) => {
            console.warn("[update] the updater could not check", error);
        });
    }
    await writeReport(options.dataDir, state);
    return { state, error: null, verified: true };
}
/** The feed electron-builder recorded beside a packaged app. */
async function recordedFeed(options) {
    if (!options.packaged)
        return null;
    const resources = options.resourcesPath ?? process.resourcesPath;
    try {
        const yml = await readFile(join(resources, "app-update.yml"), "utf8");
        return feedUrlFromAppUpdateYml(yml);
    }
    catch {
        return null;
    }
}
/** The report's path inside an app's data directory. */
export function reportPath(dataDir) {
    return join(dataDir, SUITE_UPDATE_STATE_FILE);
}
/** Write the report the hub reads. Failure is logged, never thrown: a report is a courtesy. */
export async function writeReport(dataDir, state) {
    try {
        await writeFile(reportPath(dataDir), `${JSON.stringify(state, null, 2)}\n`);
    }
    catch (error) {
        console.warn("[update] the report could not be written", error);
    }
}
/** `electron-updater`, or null when it cannot be loaded. */
async function loadUpdater() {
    try {
        const module = await import("electron-updater");
        return module.autoUpdater;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=updateCheck.js.map