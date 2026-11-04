import type { z } from "zod";
import { type LimitBreach } from "./limits.js";
/**
 * Reading and writing the two mechanical parts of an app's envelope.
 *
 * The envelope's *shape* belongs to the app — `.canvas` is canvas's, `.planner`
 * is planner's — because a shared envelope shape is the schema coupling the
 * suite exists to avoid. What is shared is how the payload is carried: a base64
 * snapshot, a size ceiling, and a JSON parse that reports every problem instead
 * of throwing.
 */
/** One reason a shape did not match. Structurally the contracts' issue, without the import. */
export interface EnvelopeIssue {
    readonly path: string;
    readonly message: string;
}
export type EnvelopeFailure = "too-large" | "not-json";
export type SnapshotFailure = "not-base64" | LimitBreach;
export type EnvelopeParse<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly reason: EnvelopeFailure;
    /** Present when the JSON parsed but the shape did not match. */
    readonly issues?: readonly EnvelopeIssue[];
};
export type SnapshotDecode = {
    readonly ok: true;
    readonly bytes: Uint8Array;
} | {
    readonly ok: false;
    readonly reason: SnapshotFailure;
};
/**
 * Parse an envelope from disk.
 *
 * The size check runs before `JSON.parse`, on the string length. That counts
 * UTF-16 units rather than bytes, which for base64 payloads — the bulk of every
 * envelope — is the same number; a text file that somehow exceeds the ceiling
 * through multi-byte content is still refused by the shape check downstream.
 */
export declare function readEnvelopeJson<T>(schema: z.ZodType<T>, text: string): EnvelopeParse<T>;
/** A snapshot as it appears inside an envelope. */
export declare function encodeSnapshot(bytes: Uint8Array): string;
/**
 * Decode a snapshot field.
 *
 * The ceiling is checked from the encoded length before decoding, so a large
 * value is refused without allocating the bytes it claims to describe.
 */
export declare function decodeSnapshot(value: string): SnapshotDecode;
/** One sentence for a refusal, for a toast or a log line. */
export declare function describeEnvelopeFailure(failure: EnvelopeParse<unknown>): string;
//# sourceMappingURL=envelope.d.ts.map