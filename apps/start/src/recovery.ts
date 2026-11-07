import { join } from "node:path";
import {
  mergeKitReports,
  parseSyncKits,
  SUITE_SYNC_KITS_FILE,
  type SyncKitReport,
  suitePaths,
} from "@suite/contracts";

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
export function kitsPathFor(app: "Canvas" | "Planner" | "Budget", options: RecoveryLookup): string {
  return join(suitePaths(app, options).data, SUITE_SYNC_KITS_FILE);
}

/** Read every app's report, merged so the newest row per device and workspace wins. */
export async function readRecoveryReports(
  options: RecoveryLookup,
  fileSystem: RecoveryFileSystem,
): Promise<readonly SyncKitReport[]> {
  const apps = ["Canvas", "Planner", "Budget"] as const;
  const reports = await Promise.all(
    apps.map(async (app) => {
      let text: string | null;
      try {
        text = await fileSystem.readText(kitsPathFor(app, options));
      } catch {
        return [];
      }
      if (text === null) return [];
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        return [];
      }
      const parsed = parseSyncKits(value);
      return parsed.ok ? parsed.value.kits : [];
    }),
  );
  return mergeKitReports([], reports.flat());
}

/**
 * What to say about one workspace, in one word.
 *
 * `made` wins over `declined` because one device that kept a file is enough to recover; a
 * workspace where nobody was ever asked says `none` rather than pretending it was declined.
 */
export function recoveryFor(
  reports: readonly SyncKitReport[],
  workspaceId: string,
): "made" | "declined" | "none" {
  const rows = reports.filter((report) => report.workspaceId === workspaceId);
  if (rows.some((row) => row.state === "made")) return "made";
  if (rows.some((row) => row.state === "declined")) return "declined";
  return "none";
}
