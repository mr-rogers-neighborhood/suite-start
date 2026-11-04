import type { z } from "zod";
/**
 * A parse outcome, shaped like `neverthrow`'s `Result` but without the
 * dependency. `@suite/contracts` is installed by every app, including a
 * renderer, so it stays Zod and nothing else; a caller that wants `Result` maps
 * this in one line at its own boundary.
 */
export type ContractParse<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly issues: readonly ContractIssue[];
};
/** One reason a document was rejected, in the caller's own vocabulary. */
export interface ContractIssue {
    /** Dotted path into the document, or `""` for the document itself. */
    readonly path: string;
    readonly message: string;
}
/** Run a schema and report every failure rather than the first. */
export declare function parseWith<T>(schema: z.ZodType<T>, value: unknown): ContractParse<T>;
/** A short, human sentence for the first issue; for logs and error copy. */
export declare function describeIssues(issues: readonly ContractIssue[]): string;
//# sourceMappingURL=parse.d.ts.map