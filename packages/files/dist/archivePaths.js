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
const MAX_PATH_LENGTH = 1024;
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are the thing this rejects; a NUL in a path is never legitimate.
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;
const DRIVE_LETTER = /^[A-Za-z]:/u;
/** Windows refuses these with or without an extension, case-insensitively. */
const RESERVED_NAMES = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu;
/**
 * The first reason `entry` is unsafe, or null when it is safe.
 *
 * Returning the reason rather than a boolean lets a reader say which entry it
 * refused and why, instead of "the bundle is invalid".
 */
export function archivePathProblem(entry) {
    if (entry.length === 0 || entry.trim().length === 0)
        return "empty";
    if (entry.length > MAX_PATH_LENGTH)
        return "too-long";
    if (entry.startsWith("/"))
        return "absolute";
    if (DRIVE_LETTER.test(entry))
        return "drive-letter";
    if (entry.includes("\\"))
        return "backslash";
    if (CONTROL_CHARACTER.test(entry))
        return "control-character";
    for (const rawSegment of entry.split("/")) {
        if (rawSegment === "")
            return "traversal";
        let segment;
        try {
            segment = decodeURIComponent(rawSegment);
        }
        catch {
            return "malformed-escape";
        }
        if (segment === "." || segment === "..")
            return "traversal";
        // A decoded escape can smuggle a separator or a control character back in.
        if (segment.includes("/") || segment.includes("\\"))
            return "traversal";
        if (CONTROL_CHARACTER.test(segment))
            return "control-character";
        if (segment.endsWith(".") || segment.endsWith(" "))
            return "trailing-dot-or-space";
        if (RESERVED_NAMES.test(segment))
            return "reserved-name";
    }
    return null;
}
/** True when the entry may be extracted as named. */
export function isSafeArchivePath(entry) {
    return archivePathProblem(entry) === null;
}
//# sourceMappingURL=archivePaths.js.map