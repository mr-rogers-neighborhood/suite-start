import { describe, expect, it } from "vitest";
import { z } from "zod";
import { bytesToBase64 } from "./base64.js";
import {
  decodeSnapshot,
  describeEnvelopeFailure,
  encodeSnapshot,
  readEnvelopeJson,
} from "./envelope.js";
import { MAX_ENVELOPE_BYTES } from "./limits.js";

const envelopeSchema = z.object({
  kind: z.literal("test.envelope"),
  version: z.number().int().positive(),
  document: z.string(),
});

const validEnvelope = {
  kind: "test.envelope",
  version: 1,
  document: bytesToBase64(new Uint8Array([1, 2, 3])),
};

describe("readEnvelopeJson", () => {
  it("parses a document that matches", () => {
    const parsed = readEnvelopeJson(envelopeSchema, JSON.stringify(validEnvelope));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.version).toBe(1);
  });

  it("reports a file that is not JSON", () => {
    const parsed = readEnvelopeJson(envelopeSchema, "{ not json");
    expect(parsed).toEqual({ ok: false, reason: "not-json" });
  });

  it("reports every shape problem when the JSON parsed", () => {
    const parsed = readEnvelopeJson(
      envelopeSchema,
      JSON.stringify({ kind: "test.envelope", version: 0 }),
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues?.map((issue) => issue.path)).toContain("version");
    expect(describeEnvelopeFailure(parsed)).toContain("version");
  });

  it("refuses before parsing when the text is over the ceiling", () => {
    const parsed = readEnvelopeJson(envelopeSchema, "x".repeat(MAX_ENVELOPE_BYTES + 1));
    expect(parsed).toEqual({ ok: false, reason: "too-large" });
    expect(describeEnvelopeFailure(parsed)).toContain("MB");
  });
});

describe("decodeSnapshot", () => {
  it("round-trips through encodeSnapshot", () => {
    const bytes = new Uint8Array([9, 8, 7, 6]);
    const decoded = decodeSnapshot(encodeSnapshot(bytes));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.bytes).toEqual(bytes);
  });

  it("refuses a value that is not base64", () => {
    expect(decodeSnapshot("not base64 !!")).toEqual({ ok: false, reason: "not-base64" });
  });

  it("refuses a snapshot over the ceiling without decoding it", () => {
    const tooLarge = "A".repeat(Math.ceil((MAX_ENVELOPE_BYTES * 4) / 3) + 8);
    expect(decodeSnapshot(tooLarge)).toEqual({ ok: false, reason: "envelope-too-large" });
  });
});
