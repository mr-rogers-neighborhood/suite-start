import { readdir, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { backupFileName, planRetention } from "../backups.js";
import { copyFileAtomic } from "./atomic.js";
import { FileMechanicsError } from "./errors.js";

/**
 * Backup rotation, applied.
 *
 * `@suite/files` decides which names may go; this module copies the current file
 * to a new backup and deletes the rest. The two are split so the decision is a
 * test with no filesystem in it.
 */

export interface BackupOptions {
  /** Distinct UTC days to keep, counting back from the newest. */
  readonly keepDays?: number;
}

export interface PruneResult {
  readonly removed: readonly string[];
  readonly kept: readonly string[];
}

/** Copy `path` to a stamped backup beside it. Returns the backup's path. */
export async function writeBackup(path: string, at: Date = new Date()): Promise<string> {
  const backupPath = join(dirname(path), backupFileName(basename(path), at));
  await copyFileAtomic(path, backupPath);
  return backupPath;
}

/**
 * Delete the backups of `path` that are past the retention window.
 *
 * A name that does not parse as one of this file's backups is left alone: it is
 * far more likely to be something the user put there than a stray we own.
 */
export async function pruneBackups(
  path: string,
  options: BackupOptions = {},
): Promise<PruneResult> {
  const directory = dirname(path);
  const baseName = basename(path);

  let names: string[];
  try {
    names = await readdir(directory);
  } catch (cause) {
    throw new FileMechanicsError("prune-failed", directory, cause);
  }

  const plan = planRetention(
    names,
    options.keepDays === undefined ? { baseName } : { baseName, keepDays: options.keepDays },
  );

  const removed: string[] = [];
  for (const name of plan.remove) {
    try {
      await rm(join(directory, name), { force: true });
      removed.push(name);
    } catch (cause) {
      throw new FileMechanicsError("prune-failed", join(directory, name), cause);
    }
  }

  return { removed, kept: plan.keep };
}
