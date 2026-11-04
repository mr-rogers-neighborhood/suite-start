/**
 * Size ceilings, in one place so a limit is published rather than discovered.
 *
 * These are the numbers an envelope reader enforces before it allocates. They
 * are deliberately generous enough for a real workspace and small enough that a
 * hostile or corrupt file cannot exhaust memory while it is being validated.
 */
/** Largest document envelope read from disk, a download, or a bundle entry. */
export declare const MAX_ENVELOPE_BYTES: number;
/** Largest single embedded attachment carried inside an envelope. */
export declare const MAX_ATTACHMENT_BYTES: number;
/** Most entries a bundle may carry, checked before anything is extracted. */
export declare const MAX_BUNDLE_ENTRIES = 500;
export type LimitBreach = "envelope-too-large" | "attachment-too-large" | "too-many-entries";
/** Null when the size is acceptable, otherwise the limit it broke. */
export declare function checkEnvelopeSize(bytes: number): LimitBreach | null;
/** Null when the size is acceptable, otherwise the limit it broke. */
export declare function checkAttachmentSize(bytes: number): LimitBreach | null;
/** Null when the count is acceptable, otherwise the limit it broke. */
export declare function checkEntryCount(entries: number): LimitBreach | null;
//# sourceMappingURL=limits.d.ts.map