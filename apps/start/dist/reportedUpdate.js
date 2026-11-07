import { join } from "node:path";
import { parseUpdateState, SUITE_APPS, SUITE_UPDATE_STATE_FILE, suitePaths, updateAvailable, } from "@suite/contracts";
/** The report an install has not written yet. */
export const UNREPORTED = {
    state: "unknown",
    version: null,
    available: null,
    checkedAt: null,
    source: null,
};
/** Where an app keeps the report: its own data directory, beside its other state. */
export function updateStatePath(appId, options) {
    const entry = SUITE_APPS.find((app) => app.id === appId);
    if (entry === undefined)
        return null;
    const paths = suitePaths(entry.folder, options);
    return join(paths.data, SUITE_UPDATE_STATE_FILE);
}
const EMPTY = UNREPORTED;
/** Read one app's report, or `unknown` when it has never written one. */
export async function readReportedUpdate(appId, options, fileSystem) {
    const path = updateStatePath(appId, options);
    if (path === null)
        return EMPTY;
    let text;
    try {
        text = await fileSystem.readText(path);
    }
    catch {
        // No file yet is the normal state of an app that has never checked.
        return EMPTY;
    }
    if (text === null)
        return EMPTY;
    let value;
    try {
        value = JSON.parse(text);
    }
    catch {
        return EMPTY;
    }
    const parsed = parseUpdateState(value);
    if (!parsed.ok)
        return EMPTY;
    return fromState(parsed.value);
}
/** The report a parsed file describes. */
export function fromState(state) {
    return {
        state: updateAvailable(state) ? "available" : "current",
        version: state.version,
        available: state.available,
        checkedAt: state.checkedAt,
        source: "app",
    };
}
//# sourceMappingURL=reportedUpdate.js.map