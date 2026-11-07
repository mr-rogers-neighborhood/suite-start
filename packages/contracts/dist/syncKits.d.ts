import { z } from "zod";
import { type ContractParse } from "./parse.js";
import type { SuitePathOptions } from "./paths.js";
/**
 * `suite.sync-kits` — what an app says about its way back in.
 *
 * A recovery file is the only thing that survives losing every device, and it is made by one
 * app on one machine. The hub is the only surface that can see all of them, so each app
 * writes a report about itself into its own data directory and the hub reads them, exactly as
 * it does for updates.
 *
 * Two states, and the second is the point: a person who declines the offer is recorded as
 * having declined, so the hub can be honest without nagging, and an app can stop asking.
 */
export declare const SUITE_SYNC_KITS_FORMAT = "suite.sync-kits";
/** The file's name inside an app's data directory. */
export declare const SUITE_SYNC_KITS_FILE = "sync-kits.json";
export declare const syncKitStateSchema: z.ZodEnum<{
    made: "made";
    declined: "declined";
}>;
export type SyncKitState = z.infer<typeof syncKitStateSchema>;
export declare const syncKitReportSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    deviceId: z.ZodString;
    state: z.ZodEnum<{
        made: "made";
        declined: "declined";
    }>;
    sealed: z.ZodDefault<z.ZodBoolean>;
    at: z.ZodISODateTime;
}, z.core.$strict>;
export type SyncKitReport = z.infer<typeof syncKitReportSchema>;
export declare const suiteSyncKitsSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.sync-kits">;
    updatedAt: z.ZodISODateTime;
    kits: z.ZodArray<z.ZodObject<{
        workspaceId: z.ZodString;
        deviceId: z.ZodString;
        state: z.ZodEnum<{
            made: "made";
            declined: "declined";
        }>;
        sealed: z.ZodDefault<z.ZodBoolean>;
        at: z.ZodISODateTime;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type SuiteSyncKits = z.infer<typeof suiteSyncKitsSchema>;
/** Parse a report read from disk without throwing; a bad file is a "no answer". */
export declare function parseSyncKits(value: unknown): ContractParse<SuiteSyncKits>;
/**
 * Merge a report into the rows a caller already has.
 *
 * Newest wins per workspace and device, so a device that declined and later changed its mind
 * reads as having a file. Order is by workspace then device, because the reader is a list.
 */
export declare function mergeKitReports(existing: readonly SyncKitReport[], incoming: readonly SyncKitReport[]): SyncKitReport[];
/** Where an app's report lives, given the app and the same path options every app resolves with. */
export declare function syncKitsReportPath(app: "Canvas" | "Planner" | "Budget", options: SuitePathOptions): string;
//# sourceMappingURL=syncKits.d.ts.map