/**
 * What to say, and whether to try again, when a launch did not work.
 *
 * An app Start starts is detached with its output discarded, which is why a binary that
 * dies in forty milliseconds looked exactly like nothing happening: the window redrew,
 * the card still said Open, and the person was left guessing. That silence cost an hour
 * of diagnosis once already.
 *
 * So the first moment of a child's life is watched. Two outcomes matter:
 *
 * - **It needed a library the machine does not have.** An AppImage links
 *   `libfuse.so.2`, which many distributions no longer install, and the runtime says so
 *   in one line. That is not a failure to report — it is a failure to retry, because
 *   `APPIMAGE_EXTRACT_AND_RUN=1` starts the same file without FUSE.
 * - **Anything else.** The child's own words, or a plain sentence when it had none.
 *
 * Pure, so the decision is a test rather than a branch nobody exercises.
 */
/** An AppImage is the one kind of file that has a FUSE fallback. */
export declare function looksLikeAppImage(path: string): boolean;
export type LaunchVerdict = {
    readonly kind: "ok";
} | {
    readonly kind: "retry-without-fuse";
    readonly reason: string;
} | {
    readonly kind: "failed";
    readonly reason: string;
};
export interface LaunchOutcome {
    /** The executable that was started. */
    readonly executable: string;
    /** Its exit code, or null when a signal ended it. */
    readonly exitCode: number | null;
    /** What it wrote to stderr in the moment before it exited. */
    readonly stderr: string;
}
/**
 * Read one failed launch.
 *
 * Only called for a child that exited non-zero or was killed: a successful launch has
 * nothing to say, and its output was thrown away on purpose so a long-lived app cannot
 * fill a pipe nobody drains.
 */
export declare function launchVerdict(outcome: LaunchOutcome): LaunchVerdict;
//# sourceMappingURL=launchCheck.d.ts.map