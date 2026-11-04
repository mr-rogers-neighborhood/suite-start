import type { z } from "zod";
import { base64ToBytes, bytesToBase64 } from "./base64.js";
import { checkEnvelopeSize, type LimitBreach, MAX_ENVELOPE_BYTES } from "./limits.js";

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

export type EnvelopeParse<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly reason: EnvelopeFailure;
      /** Present when the JSON parsed but the shape did not match. */
      readonly issues?: readonly EnvelopeIssue[];
    };

export type SnapshotDecode =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly reason: SnapshotFailure };

/**
 * Parse an envelope from disk.
 *
 * The size check runs before `JSON.parse`, on the string length. That counts
 * UTF-16 units rather than bytes, which for base64 payloads — the bulk of every
 * envelope — is the same number; a text file that somehow exceeds the ceiling
 * through multi-byte content is still refused by the shape check downstream.
 */
export function readEnvelopeJson<T>(schema: z.ZodType<T>, text: string): EnvelopeParse<T> {
  if (text.length > MAX_ENVELOPE_BYTES) return { ok: false, reason: "too-large" };

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }

  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    reason: "not-json",
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}

/** A snapshot as it appears inside an envelope. */
export function encodeSnapshot(bytes: Uint8Array): string {
  return bytesToBase64(bytes);
}

/**
 * Decode a snapshot field.
 *
 * The ceiling is checked from the encoded length before decoding, so a large
 * value is refused without allocating the bytes it claims to describe.
 */
export function decodeSnapshot(value: string): SnapshotDecode {
  const tooLarge = checkEnvelopeSize(Math.floor((value.length * 3) / 4));
  if (tooLarge !== null) return { ok: false, reason: tooLarge };

  const bytes = base64ToBytes(value);
  if (bytes === null) return { ok: false, reason: "not-base64" };
  return { ok: true, bytes };
}

/** One sentence for a refusal, for a toast or a log line. */
export function describeEnvelopeFailure(failure: EnvelopeParse<unknown>): string {
  if (failure.ok) return "";
  const first = failure.issues?.[0];
  if (first) return first.path.length > 0 ? `${first.path}: ${first.message}` : first.message;
  return failure.reason === "too-large"
    ? `the file is larger than ${Math.round(MAX_ENVELOPE_BYTES / (1024 * 1024))} MB`
    : "the file is not a Suite document";
}
