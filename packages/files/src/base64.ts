/**
 * Bytes to text and back, for the one place the suite needs it: a snapshot
 * inside a JSON envelope.
 *
 * `btoa`/`atob` are global in Node 22 and in every browser, so this module has
 * no dependency and runs wherever an envelope is read. The chunking matters: a
 * `String.fromCharCode(...bytes)` over a multi-megabyte snapshot overflows the
 * argument limit and throws a stack error that reads like a corrupt file.
 */

const CHUNK_SIZE = 0x8000;

/** Base64 for a byte array, chunked so a large snapshot cannot blow the stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE));
  }
  return btoa(binary);
}

/**
 * Bytes for a base64 string, or null when it is not base64 at all.
 *
 * A caller distinguishes "this is not base64" from "this decodes to nothing": an
 * empty string is a legitimate empty payload, while a corrupt one is a file to
 * refuse rather than rewrite.
 */
export function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}
