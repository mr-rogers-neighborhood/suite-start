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
export declare const BACKUP_SUFFIX = ".bak";
/** Default distinct UTC days to keep. The newest backup is kept regardless. */
export declare const DEFAULT_KEEP_DAYS = 7;
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
export declare function backupStamp(at: Date): string;
/** The full backup file name for `baseName` taken at `at`. */
export declare function backupFileName(baseName: string, at: Date): string;
/**
 * The moment a backup name records, or null when the name is not one of ours.
 *
 * A name that does not parse is left alone by retention rather than deleted: an
 * unreadable name is far more likely to be a user's own file than a stray.
 */
export declare function backupTimestamp(name: string, baseName: string): number | null;
/**
 * Which backups to keep and which to remove.
 *
 * Newest first, one per UTC day, up to `keepDays` days. The newest backup is
 * always kept even when it shares a day with a newer one, because it is the copy
 * a user reaches for first. Names that are not backups of `baseName` are neither
 * kept nor removed: they are not this function's business.
 */
export declare function planRetention(names: readonly string[], options: RetentionOptions): RetentionPlan;
//# sourceMappingURL=backups.d.ts.map