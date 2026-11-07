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

/** The line AppImage's runtime prints when FUSE 2 is missing. */
const FUSE_2_MISSING = /libfuse\.so\.2|dlopen\(\)/iu;

/** An AppImage is the one kind of file that has a FUSE fallback. */
export function looksLikeAppImage(path: string): boolean {
  return /\.AppImage$/u.test(path);
}

export type LaunchVerdict =
  | { readonly kind: "ok" }
  | { readonly kind: "retry-without-fuse"; readonly reason: string }
  | { readonly kind: "failed"; readonly reason: string };

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
export function launchVerdict(outcome: LaunchOutcome): LaunchVerdict {
  const said = outcome.stderr.trim();
  const firstLine =
    said
      .split(/\r?\n/u)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "";

  if (looksLikeAppImage(outcome.executable) && FUSE_2_MISSING.test(said)) {
    return {
      kind: "retry-without-fuse",
      reason: "this app needs FUSE 2 to open, which this machine does not have",
    };
  }

  if (firstLine.length > 0) return { kind: "failed", reason: firstLine };

  return {
    kind: "failed",
    reason:
      outcome.exitCode === null
        ? "it stopped before a window opened"
        : `it stopped before a window opened (exit ${outcome.exitCode})`,
  };
}
