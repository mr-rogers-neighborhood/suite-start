import type { z } from "zod";

/**
 * A parse outcome, shaped like `neverthrow`'s `Result` but without the
 * dependency. `@suite/contracts` is installed by every app, including a
 * renderer, so it stays Zod and nothing else; a caller that wants `Result` maps
 * this in one line at its own boundary.
 */
export type ContractParse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ContractIssue[] };

/** One reason a document was rejected, in the caller's own vocabulary. */
export interface ContractIssue {
  /** Dotted path into the document, or `""` for the document itself. */
  readonly path: string;
  readonly message: string;
}

/** Run a schema and report every failure rather than the first. */
export function parseWith<T>(schema: z.ZodType<T>, value: unknown): ContractParse<T> {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}

/** A short, human sentence for the first issue; for logs and error copy. */
export function describeIssues(issues: readonly ContractIssue[]): string {
  const first = issues[0];
  if (!first) return "the document did not match the schema";
  return first.path.length > 0 ? `${first.path}: ${first.message}` : first.message;
}
