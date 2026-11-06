import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SUITE_UPDATE_STATE_FILE, } from "@suite/contracts";
/** Ask the feed once, write the report, and say what happened. */
export async function checkForUpdates(options) {
    const now = options.now ?? (() => new Date());
    const checkedAt = now().toISOString();
    if (!options.packaged && options.updater === undefined) {
        return {
            state: {
                format: "suite.update-state",
                version: options.version,
                available: null,
                checkedAt: null,
                channel: options.channel,
            },
            error: "this build has no update feed",
        };
    }
    const updater = options.updater ?? (await loadUpdater());
    if (updater === null) {
        return {
            state: {
                format: "suite.update-state",
                version: options.version,
                available: null,
                checkedAt: null,
                channel: options.channel,
            },
            error: "electron-updater is not available",
        };
    }
    // Never download unasked: an app that starts pulling a binary at launch is an
    // app that spends someone's bandwidth on a decision they did not make.
    updater.autoDownload = false;
    try {
        const result = await updater.checkForUpdates();
        const offered = result?.updateInfo.version ?? null;
        const state = {
            format: "suite.update-state",
            version: options.version,
            available: offered === null ? null : offered,
            checkedAt,
            channel: options.channel,
        };
        await writeReport(options.dataDir, state);
        return { state, error: null };
    }
    catch (error) {
        const state = {
            format: "suite.update-state",
            version: options.version,
            available: null,
            checkedAt,
            channel: options.channel,
        };
        await writeReport(options.dataDir, state);
        return { state, error: error instanceof Error ? error.message : "the check failed" };
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