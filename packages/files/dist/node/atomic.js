import { randomUUID } from "node:crypto";
import { copyFile, open, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { FileMechanicsError } from "./errors.js";
async function syncDirectory(path) {
    // Best effort. Losing this loses the guarantee that the rename survives a
    // power cut, not the guarantee that the file is whole.
    try {
        const handle = await open(path, "r");
        try {
            await handle.sync();
        }
        finally {
            await handle.close();
        }
    }
    catch {
        // A directory that cannot be opened for reading is not an error here.
    }
}
async function withTempFile(path, write) {
    const directory = dirname(path);
    const temp = join(directory, `.${basename(path)}.${randomUUID()}.tmp`);
    try {
        await write(temp);
        await rename(temp, path);
    }
    catch (cause) {
        await rm(temp, { force: true }).catch(() => {
            // The temp file may never have been created; nothing to clean up.
        });
        if (cause instanceof FileMechanicsError)
            throw cause;
        throw new FileMechanicsError("write-failed", path, cause);
    }
}
/** Replace `path` with `bytes`, atomically. */
export async function writeFileAtomic(path, bytes, options = {}) {
    await withTempFile(path, async (temp) => {
        const handle = await open(temp, "wx", 0o600);
        try {
            await handle.writeFile(bytes);
            await handle.sync();
        }
        finally {
            await handle.close();
        }
    });
    if (options.syncDirectory !== false)
        await syncDirectory(dirname(path));
}
/** Copy `from` over `to`, atomically. Used for a backup, which may be large. */
export async function copyFileAtomic(from, to, options = {}) {
    await withTempFile(to, async (temp) => {
        await copyFile(from, temp);
    });
    if (options.syncDirectory !== false)
        await syncDirectory(dirname(to));
}
/** Move a finished temp file into place, for a writer that already has one. */
export async function replaceFile(temp, path) {
    try {
        await rename(temp, path);
    }
    catch (cause) {
        throw new FileMechanicsError("rename-failed", path, cause);
    }
    await syncDirectory(dirname(path));
}
//# sourceMappingURL=atomic.js.map