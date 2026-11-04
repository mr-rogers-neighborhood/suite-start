import { readFile, stat } from "node:fs/promises";
import { FileMechanicsError } from "./errors.js";

/**
 * Read a file, refusing before it allocates.
 *
 * An envelope reader is the app's largest single allocation and its most
 * attacker-reachable one: a bundle or a download can name any size. Checking
 * `stat` first means a hostile file costs one syscall rather than the memory it
 * claims to need.
 */
export async function readFileWithLimit(path: string, maxBytes: number): Promise<Uint8Array> {
  let size: number;
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new FileMechanicsError("not-a-file", path);
    size = info.size;
  } catch (cause) {
    if (cause instanceof FileMechanicsError) throw cause;
    throw new FileMechanicsError("not-a-file", path, cause);
  }

  if (size > maxBytes) throw new FileMechanicsError("too-large", path);

  try {
    return new Uint8Array(await readFile(path));
  } catch (cause) {
    throw new FileMechanicsError("read-failed", path, cause);
  }
}

/** The text form, for an envelope that is JSON. */
export async function readTextWithLimit(path: string, maxBytes: number): Promise<string> {
  const bytes = await readFileWithLimit(path, maxBytes);
  return new TextDecoder().decode(bytes);
}
