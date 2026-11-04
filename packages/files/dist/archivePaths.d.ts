/**
 * Is this string safe to use as a path *inside* an archive?
 *
 * A bundle or a backup is a ZIP a stranger may have produced. Extracting one
 * without checking names is zip slip: an entry called `../../.ssh/authorized_keys`
 * is written wherever the archive says. The check is a pure predicate so it can
 * run before anything is extracted, and it is shared because every reader of a
 * suite archive needs exactly this answer.
 *
 * The rules err towards refusing:
 *
 * - absolute paths, drive letters and backslashes are out, because they mean
 *   something different on each platform;
 * - `.`, `..` and empty segments are out, and a percent-encoded one is decoded
 *   before the check so `%2e%2e` cannot slip through;
 * - trailing dots and spaces are out, because Windows silently strips them and
 *   two entries could then collide;
 * - Windows device names are out, because extracting `CON` is not a file.
 */
export type ArchivePathProblem = "empty" | "too-long" | "absolute" | "drive-letter" | "backslash" | "traversal" | "control-character" | "trailing-dot-or-space" | "reserved-name" | "malformed-escape";
/**
 * The first reason `entry` is unsafe, or null when it is safe.
 *
 * Returning the reason rather than a boolean lets a reader say which entry it
 * refused and why, instead of "the bundle is invalid".
 */
export declare function archivePathProblem(entry: string): ArchivePathProblem | null;
/** True when the entry may be extracted as named. */
export declare function isSafeArchivePath(entry: string): boolean;
//# sourceMappingURL=archivePaths.d.ts.map