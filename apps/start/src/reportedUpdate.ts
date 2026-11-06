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

/**
 * The report a check produces, which wins over what the app last said.
 *
 * A check is newer by construction: it ran because a person asked for it now. When
 * the check finds nothing newer, the card says so and says when, rather than
 * falling back to a report from three weeks ago.
 */
export function fromCheck(
  installedVersion: string,
  check: {
    readonly version: string | null;
    readonly reason: string | null;
    readonly checkedAt: string;
  },
): ReportedUpdate {
  if (check.version === null) return UNREPORTED;
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
export function fromState(state: SuiteUpdateState): ReportedUpdate {
  return {
    state: updateAvailable(state) ? "available" : "current",
    version: state.version,
    available: state.available,
    checkedAt: state.checkedAt,
    source: "app",
  };
}
