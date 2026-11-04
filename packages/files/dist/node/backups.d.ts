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
export declare function writeBackup(path: string, at?: Date): Promise<string>;
/**
 * Delete the backups of `path` that are past the retention window.
 *
 * A name that does not parse as one of this file's backups is left alone: it is
 * far more likely to be something the user put there than a stray we own.
 */
export declare function pruneBackups(path: string, options?: BackupOptions): Promise<PruneResult>;
//# sourceMappingURL=backups.d.ts.map