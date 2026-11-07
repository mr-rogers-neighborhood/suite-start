import { z } from "zod";
import { type ContractParse, parseWith } from "./parse.js";
import type { SuitePathOptions } from "./paths.js";
import { joinPath, suitePaths } from "./paths.js";

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
export const SUITE_SYNC_KITS_FORMAT = "suite.sync-kits";

/** The file's name inside an app's data directory. */
export const SUITE_SYNC_KITS_FILE = "sync-kits.json";

export const syncKitStateSchema = z.enum(["made", "declined"]);

export type SyncKitState = z.infer<typeof syncKitStateSchema>;

export const syncKitReportSchema = z
  .object({
    workspaceId: z.string().min(1),
    deviceId: z.string().min(1),
    /** What this device did about its recovery file for that workspace. */
    state: syncKitStateSchema,
    /** True when the file was written with a passphrase, which is worth saying. */
    sealed: z.boolean().default(false),
    at: z.iso.datetime(),
  })
  .strict();

export type SyncKitReport = z.infer<typeof syncKitReportSchema>;

export const suiteSyncKitsSchema = z
  .object({
    format: z.literal(SUITE_SYNC_KITS_FORMAT),
    updatedAt: z.iso.datetime(),
    /** One row per device and workspace this app knows about. */
    kits: z.array(syncKitReportSchema),
  })
  .strict();

export type SuiteSyncKits = z.infer<typeof suiteSyncKitsSchema>;

/** Parse a report read from disk without throwing; a bad file is a "no answer". */
export function parseSyncKits(value: unknown): ContractParse<SuiteSyncKits> {
  return parseWith(suiteSyncKitsSchema, value);
}

/**
 * Merge a report into the rows a caller already has.
 *
 * Newest wins per workspace and device, so a device that declined and later changed its mind
 * reads as having a file. Order is by workspace then device, because the reader is a list.
 */
export function mergeKitReports(
  existing: readonly SyncKitReport[],
  incoming: readonly SyncKitReport[],
): SyncKitReport[] {
  const byKey = new Map<string, SyncKitReport>();
  for (const report of [...existing, ...incoming]) {
    const key = `${report.workspaceId}\u0000${report.deviceId}`;
    const current = byKey.get(key);
    if (current === undefined || current.at <= report.at) byKey.set(key, report);
  }
  return [...byKey.values()].sort(
    (left, right) =>
      left.workspaceId.localeCompare(right.workspaceId) ||
      left.deviceId.localeCompare(right.deviceId),
  );
}

/** Where an app's report lives, given the app and the same path options every app resolves with. */
export function syncKitsReportPath(
  app: "Canvas" | "Planner" | "Budget",
  options: SuitePathOptions,
): string {
  return joinPath(options.platform, suitePaths(app, options).data, SUITE_SYNC_KITS_FILE);
}
