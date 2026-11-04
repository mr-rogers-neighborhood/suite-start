/**
 * Size ceilings, in one place so a limit is published rather than discovered.
 *
 * These are the numbers an envelope reader enforces before it allocates. They
 * are deliberately generous enough for a real workspace and small enough that a
 * hostile or corrupt file cannot exhaust memory while it is being validated.
 */

const KIB = 1024;
const MIB = 1024 * KIB;

/** Largest document envelope read from disk, a download, or a bundle entry. */
export const MAX_ENVELOPE_BYTES = 64 * MIB;

/** Largest single embedded attachment carried inside an envelope. */
export const MAX_ATTACHMENT_BYTES = 16 * MIB;

/** Most entries a bundle may carry, checked before anything is extracted. */
export const MAX_BUNDLE_ENTRIES = 500;

export type LimitBreach = "envelope-too-large" | "attachment-too-large" | "too-many-entries";

/** Null when the size is acceptable, otherwise the limit it broke. */
export function checkEnvelopeSize(bytes: number): LimitBreach | null {
  return bytes > MAX_ENVELOPE_BYTES ? "envelope-too-large" : null;
}

/** Null when the size is acceptable, otherwise the limit it broke. */
export function checkAttachmentSize(bytes: number): LimitBreach | null {
  return bytes > MAX_ATTACHMENT_BYTES ? "attachment-too-large" : null;
}

/** Null when the count is acceptable, otherwise the limit it broke. */
export function checkEntryCount(entries: number): LimitBreach | null {
  return entries > MAX_BUNDLE_ENTRIES ? "too-many-entries" : null;
}
