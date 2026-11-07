import { join } from "node:path";
import {
  parseUpdateState,
  SUITE_APPS,
  SUITE_UPDATE_STATE_FILE,
  type SuiteUpdateState,
  suitePaths,
  updateAvailable,
} from "@suite/contracts";

/**
 * What an app says about its own updating.
 *
 * An app writes `update-state.json` into its own data directory after it has asked its
 * own feed, and this reads it. A file that is absent, unreadable or about another format
 * is `unknown` rather than an error: an app that has never checked has not failed.
 *
 * This is now a **second opinion**, not the hub's answer. The catalogue reads the same
 * signed feeds the apps read, because Start is what installs and replaces an app (D45).
 * The report is still worth reading: an app Start did not install updates itself, and its
 * card can say what that app found.
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
  /** Who answered — the app's own report, and null for an app that never wrote one. */
  readonly source: "app" | null;
}

/** The report an install has not written yet. */
export const UNREPORTED: ReportedUpdate = {
  state: "unknown",
  version: null,
  available: null,
  checkedAt: null,
  source: null,
};

/** Where an app keeps the report: its own data directory, beside its other state. */
export function updateStatePath(appId: string, options: UpdateLookup): string | null {
  const entry = SUITE_APPS.find((app) => app.id === appId);
  if (entry === undefined) return null;
  const paths = suitePaths(entry.folder, options);
  return join(paths.data, SUITE_UPDATE_STATE_FILE);
}

export interface UpdateLookup {
  readonly platform: string;
  readonly home: string;
  readonly xdgDataHome?: string | undefined;
}

/** The filesystem this module needs, so the rule is a test rather than a machine. */
export interface UpdateFileSystem {
  readonly readText: (path: string) => Promise<string | null>;
}

const EMPTY: ReportedUpdate = UNREPORTED;

/** Read one app's report, or `unknown` when it has never written one. */
export async function readReportedUpdate(
  appId: string,
  options: UpdateLookup,
  fileSystem: UpdateFileSystem,
): Promise<ReportedUpdate> {
  const path = updateStatePath(appId, options);
  if (path === null) return EMPTY;
  let text: string | null;
  try {
    text = await fileSystem.readText(path);
  } catch {
    // No file yet is the normal state of an app that has never checked.
    return EMPTY;
  }
  if (text === null) return EMPTY;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return EMPTY;
  }
  const parsed = parseUpdateState(value);
  if (!parsed.ok) return EMPTY;
  return fromState(parsed.value);
}

/** The report a parsed file describes. */
export function fromState(state: SuiteUpdateState): ReportedUpdate {
  return {
    state: updateAvailable(state) ? "available" : "current",
    version: state.version,
    available: state.available,
    checkedAt: state.checkedAt,
    source: "app",
  };
}
