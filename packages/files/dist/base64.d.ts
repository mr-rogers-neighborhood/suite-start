/**
 * Bytes to text and back, for the one place the suite needs it: a snapshot
 * inside a JSON envelope.
 *
 * `btoa`/`atob` are global in Node 22 and in every browser, so this module has
 * no dependency and runs wherever an envelope is read. The chunking matters: a
 * `String.fromCharCode(...bytes)` over a multi-megabyte snapshot overflows the
 * argument limit and throws a stack error that reads like a corrupt file.
 */
/** Base64 for a byte array, chunked so a large snapshot cannot blow the stack. */
export declare function bytesToBase64(bytes: Uint8Array): string;
/**
 * Bytes for a base64 string, or null when it is not base64 at all.
 *
 * A caller distinguishes "this is not base64" from "this decodes to nothing": an
 * empty string is a legitimate empty payload, while a corrupt one is a file to
 * refuse rather than rewrite.
 */
export declare function base64ToBytes(value: string): Uint8Array | null;
//# sourceMappingURL=base64.d.ts.map