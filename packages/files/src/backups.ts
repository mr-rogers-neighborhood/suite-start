/**
 * Backup naming and retention, as pure functions.
 *
 * Every suite app keeps the same promise: a write either replaces the file or
 * leaves it alone, and the previous version survives long enough to notice a bad
 * one. That means the *mechanics* are shared while the *contents* stay with the
 * app — so this module never reads a file, it only says what to call a backup
 * and which old ones may go.
 *
 * Names are the storage, not a side table. `<file>.<stamp>.bak` beside the file
 * means a user can recover with a file manager when the app is the thing that
 * broke.
 */

/** Suffix that marks a file as a backup. */
export const BACKUP_SUFFIX = ".bak";

const STAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/u;
const DAY_LENGTH_MS = 24 * 60 * 60 * 1000;

/** Default distinct UTC days to keep. The newest backup is kept regardless. */
export const DEFAULT_KEEP_DAYS = 7;

export interface RetentionOptions {
  /** The file the backups belong to, as it appears on disk (name, not path). */
  readonly baseName: string;
  /** Distinct UTC days to keep, counting back from the newest backup. */
  readonly keepDays?: number;
}

export interface RetentionPlan {
  readonly keep: readonly string[];
  readonly remove: readonly string[];
}

/**
 * The stamp for a moment, in a form that sorts lexically and survives a
 * filesystem that dislikes colons.
 */
export function backupStamp(at: Date): string {
  // 2026-11-04T20:00:00.000Z → 2026-11-04T20-00-00-000Z
  return at.toISOString().replaceAll(":", "-").replace(".", "-");
}

/** The full backup file name for `baseName` taken at `at`. */
export function backupFileName(baseName: string, at: Date): string {
  return `${baseName}.${backupStamp(at)}${BACKUP_SUFFIX}`;
}

/**
 * The moment a backup name records, or null when the name is not one of ours.
 *
 * A name that does not parse is left alone by retention rather than deleted: an
 * unreadable name is far more likely to be a user's own file than a stray.
 */
export function backupTimestamp(name: string, baseName: string): number | null {
  const prefix = `${baseName}.`;
  if (!name.startsWith(prefix) || !name.endsWith(BACKUP_SUFFIX)) return null;
  const stamp = name.slice(prefix.length, name.length - BACKUP_SUFFIX.length);
  if (!STAMP_PATTERN.test(stamp)) return null;
  // Rebuild the ISO form the stamp was made from.
  const iso = stamp.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/u, "T$1:$2:$3.$4Z");
  const millis = Date.parse(iso);
  return Number.isNaN(millis) ? null : millis;
}

function utcDay(millis: number): string {
  return new Date(Math.floor(millis / DAY_LENGTH_MS) * DAY_LENGTH_MS).toISOString().slice(0, 10);
}

/**
 * Which backups to keep and which to remove.
 *
 * Newest first, one per UTC day, up to `keepDays` days. The newest backup is
 * always kept even when it shares a day with a newer one, because it is the copy
 * a user reaches for first. Names that are not backups of `baseName` are neither
 * kept nor removed: they are not this function's business.
 */
export function planRetention(names: readonly string[], options: RetentionOptions): RetentionPlan {
  const keepDays = options.keepDays ?? DEFAULT_KEEP_DAYS;

  const backups = names
    .map((name) => ({ name, at: backupTimestamp(name, options.baseName) }))
    .filter((entry): entry is { name: string; at: number } => entry.at !== null)
    .sort((left, right) => right.at - left.at);

  if (backups.length === 0) return { keep: [], remove: [] };
  if (keepDays <= 0) {
    return { keep: [], remove: backups.map((entry) => entry.name) };
  }

  const keep = new Set<string>();
  const days = new Set<string>();
  for (const backup of backups) {
    const day = utcDay(backup.at);
    const isNewDay = !days.has(day);
    if (isNewDay && days.size >= keepDays) continue;
    days.add(day);
    keep.add(backup.name);
  }

  return {
    keep: backups.map((entry) => entry.name).filter((name) => keep.has(name)),
    remove: backups.map((entry) => entry.name).filter((name) => !keep.has(name)),
  };
}
