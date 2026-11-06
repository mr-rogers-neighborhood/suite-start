import { z } from "zod";
import { suiteReleaseChannelSchema, suiteSemverSchema } from "./appManifest.js";
import { type ContractParse, parseWith } from "./parse.js";

/**
 * `suite.update-state` — what an app says about its own updating.
 *
 * The app owns its bytes and its own release feed: it is the only process that
 * may replace its binary, and the only one that talks to its feed. The hub is a
 * reader, so an app writes this file into its own data directory after it has
 * asked, and the hub shows what it finds, including when it was asked.
 *
 * It is deliberately a report rather than a command. Nothing here can make an app
 * update, and nothing here is a version the hub may act on: a stale file is
 * visible as a stale `checkedAt`, which is the honest way to show it.
 */
export const SUITE_UPDATE_STATE_FORMAT = "suite.update-state";

/** The file's name inside an app's data directory. */
export const SUITE_UPDATE_STATE_FILE = "update-state.json";

export const suiteUpdateStateSchema = z
  .object({
    format: z.literal(SUITE_UPDATE_STATE_FORMAT),
    /** The version this installation is running. */
    version: suiteSemverSchema,
    /** What the feed last offered, or null when the app is current. */
    available: suiteSemverSchema.nullable().default(null),
    /** When the app last asked its feed. Null until it has asked once. */
    checkedAt: z.iso.datetime().nullable().default(null),
    channel: suiteReleaseChannelSchema.default("stable"),
  })
  .strict();

export type SuiteUpdateState = z.infer<typeof suiteUpdateStateSchema>;

/** Parse a report read from disk without throwing; a bad file is a "no answer". */
export function parseUpdateState(value: unknown): ContractParse<SuiteUpdateState> {
  return parseWith(suiteUpdateStateSchema, value);
}

/**
 * True when the report names an update this installation does not have.
 *
 * A plain string comparison is wrong for prereleases (`0.1.0-alpha.10` sorts
 * before `0.1.0-alpha.9`), so this compares numeric segments and treats a
 * prerelease as older than the release it leads to. It is the smallest correct
 * comparison for "is there something newer", not a general semver library.
 */
export function updateAvailable(state: SuiteUpdateState): boolean {
  if (state.available === null) return false;
  return compareVersions(state.available, state.version) > 0;
}

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => {
    const withoutBuild = value.split("+", 1)[0] ?? value;
    const [core, prerelease = null] = withoutBuild.split("-", 2) as [string, string | null];
    const numbers = core.split(".").map((part) => Number.parseInt(part, 10));
    return { numbers, prerelease };
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < Math.max(a.numbers.length, b.numbers.length); index += 1) {
    const difference = (a.numbers[index] ?? 0) - (b.numbers[index] ?? 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  // A prerelease is older than the release it leads to.
  if (a.prerelease === null && b.prerelease !== null) return 1;
  if (a.prerelease !== null && b.prerelease === null) return -1;
  if (a.prerelease === null || b.prerelease === null) return 0;
  return comparePrerelease(a.prerelease, b.prerelease);
}

/**
 * Compare two prerelease strings the way semver does.
 *
 * Identifier by identifier: numbers compare as numbers, so `alpha.10` is newer
 * than `alpha.9`; a numeric identifier is older than an alphanumeric one; and a
 * longer list wins when everything before it is equal (`alpha` < `alpha.1`).
 */
function comparePrerelease(left: string, right: string): number {
  const a = left.split(".");
  const b = right.split(".");
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const l = a[index];
    const r = b[index];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    const lNumeric = /^\d+$/u.test(l);
    const rNumeric = /^\d+$/u.test(r);
    if (lNumeric && rNumeric) {
      const difference = Number(l) - Number(r);
      if (difference !== 0) return difference < 0 ? -1 : 1;
      continue;
    }
    if (lNumeric !== rNumeric) return lNumeric ? -1 : 1;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}
