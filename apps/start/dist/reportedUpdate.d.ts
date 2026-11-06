import { type SuiteUpdateState } from "@suite/contracts";
/**
 * What an app says about its own updating.
 *
 * The app owns its bytes and its feed, so the hub never asks a feed anything. An
 * app writes `update-state.json` into its own data directory after it has asked,
 * and this reads it. A file that is absent, unreadable or about another format is
 * `unknown` rather than an error: an app that has never checked has not failed.
 */
export interface ReportedUpdate {
    /** Whether a newer version is known to exist. */
    readonly state: "unknown" | "current" | "available";
    /** The version the app is running, when it reported one. */
    readonly version: string | null;
    /** The version its feed last offered, when that is newer than the one it runs. */
    readonly available: string | null;
    /** When the app last asked, ISO-8601. */
    readonly checkedAt: string | null;
    /** Who answered: the app's own report, or a check the hub ran when asked. */
    readonly source: "app" | "check" | null;
}
/** The report an install has not written yet. */
export declare const UNREPORTED: ReportedUpdate;
/** Where an app keeps the report: its own data directory, beside its other state. */
export declare function updateStatePath(appId: string, options: UpdateLookup): string | null;
export interface UpdateLookup {
    readonly platform: string;
    readonly home: string;
    readonly xdgDataHome?: string | undefined;
}
/** The filesystem this module needs, so the rule is a test rather than a machine. */
export interface UpdateFileSystem {
    readonly readText: (path: string) => Promise<string | null>;
}
/** Read one app's report, or `unknown` when it has never written one. */
export declare function readReportedUpdate(appId: string, options: UpdateLookup, fileSystem: UpdateFileSystem): Promise<ReportedUpdate>;
/**
 * The report a check produces, which wins over what the app last said.
 *
 * A check is newer by construction: it ran because a person asked for it now. When
 * the check finds nothing newer, the card says so and says when, rather than
 * falling back to a report from three weeks ago.
 */
export declare function fromCheck(installedVersion: string, check: {
    readonly version: string | null;
    readonly reason: string | null;
    readonly checkedAt: string;
}): ReportedUpdate;
/** The report a parsed file describes. */
export declare function fromState(state: SuiteUpdateState): ReportedUpdate;
//# sourceMappingURL=reportedUpdate.d.ts.map