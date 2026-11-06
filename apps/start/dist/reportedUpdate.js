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
/**
 * The report a check produces, which wins over what the app last said.
 *
 * A check is newer by construction: it ran because a person asked for it now. When
 * the check finds nothing newer, the card says so and says when, rather than
 * falling back to a report from three weeks ago.
 */
export function fromCheck(installedVersion, check) {
    if (check.version === null)
        return UNREPORTED;
    const available = updateAvailable({
        format: "suite.update-state",
        version: installedVersion,
        available: check.version,
        checkedAt: check.checkedAt,
        channel: "stable",
    });
    return {
        state: available ? "available" : "current",
        version: installedVersion,
        available: check.version,
        checkedAt: check.checkedAt,
        source: "check",
    };
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