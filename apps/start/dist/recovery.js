import { join } from "node:path";
import { mergeKitReports, parseSyncKits, SUITE_SYNC_KITS_FILE, suitePaths, } from "@suite/contracts";
/** Where one app keeps its report: its own data directory, beside its other state. */
export function kitsPathFor(app, options) {
    return join(suitePaths(app, options).data, SUITE_SYNC_KITS_FILE);
}
/** Read every app's report, merged so the newest row per device and workspace wins. */
export async function readRecoveryReports(options, fileSystem) {
    const apps = ["Canvas", "Planner", "Budget"];
    const reports = await Promise.all(apps.map(async (app) => {
        let text;
        try {
            text = await fileSystem.readText(kitsPathFor(app, options));
        }
        catch {
            return [];
        }
        if (text === null)
            return [];
        let value;
        try {
            value = JSON.parse(text);
        }
        catch {
            return [];
        }
        const parsed = parseSyncKits(value);
        return parsed.ok ? parsed.value.kits : [];
    }));
    return mergeKitReports([], reports.flat());
}
/**
 * What to say about one workspace, in one word.
 *
 * `made` wins over `declined` because one device that kept a file is enough to recover; a
 * workspace where nobody was ever asked says `none` rather than pretending it was declined.
 */
export function recoveryFor(reports, workspaceId) {
    const rows = reports.filter((report) => report.workspaceId === workspaceId);
    if (rows.some((row) => row.state === "made"))
        return "made";
    if (rows.some((row) => row.state === "declined"))
        return "declined";
    return "none";
}
//# sourceMappingURL=recovery.js.map