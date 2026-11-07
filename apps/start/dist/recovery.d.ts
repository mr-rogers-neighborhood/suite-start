import { type SyncKitReport } from "@suite/contracts";
/**
 * What the apps on this machine say about their way back in.
 *
 * A recovery file is the only thing that survives losing every device, and it is made by one
 * app on one machine — so the hub is the only surface that can see all of them. Each app
 * writes `sync-kits.json` into its own data directory and this reads them, the way
 * `reportedUpdate.ts` reads the update reports. A file that is absent, unreadable or about
 * another format is *not reported*, which is different from *declined*: one is a person who
 * has never been asked, the other is a person who said no.
 */
export interface RecoveryLookup {
    readonly platform: string;
    readonly home: string;
    readonly xdgDataHome?: string | undefined;
}
export interface RecoveryFileSystem {
    readonly readText: (path: string) => Promise<string | null>;
}
/** Where one app keeps its report: its own data directory, beside its other state. */
export declare function kitsPathFor(app: "Canvas" | "Planner" | "Budget", options: RecoveryLookup): string;
/** Read every app's report, merged so the newest row per device and workspace wins. */
export declare function readRecoveryReports(options: RecoveryLookup, fileSystem: RecoveryFileSystem): Promise<readonly SyncKitReport[]>;
/**
 * What to say about one workspace, in one word.
 *
 * `made` wins over `declined` because one device that kept a file is enough to recover; a
 * workspace where nobody was ever asked says `none` rather than pretending it was declined.
 */
export declare function recoveryFor(reports: readonly SyncKitReport[], workspaceId: string): "made" | "declined" | "none";
//# sourceMappingURL=recovery.d.ts.map