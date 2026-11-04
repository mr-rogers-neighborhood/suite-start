/**
 * A failure a caller can branch on, because "the file is too large" and "the
 * disk is full" want different words in front of a user.
 */
export type FileMechanicsErrorCode =
  | "not-a-file"
  | "too-large"
  | "read-failed"
  | "write-failed"
  | "rename-failed"
  | "prune-failed";

export class FileMechanicsError extends Error {
  readonly code: FileMechanicsErrorCode;
  readonly path: string;

  constructor(code: FileMechanicsErrorCode, path: string, cause?: unknown) {
    super(`${code}: ${path}`, cause === undefined ? undefined : { cause });
    this.name = "FileMechanicsError";
    this.code = code;
    this.path = path;
  }
}
