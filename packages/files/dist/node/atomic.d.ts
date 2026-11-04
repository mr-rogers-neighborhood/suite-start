/**
 * Write a whole file or change nothing.
 *
 * The sequence is temp file → `fsync` → `rename` → `fsync` the directory. A
 * half-written envelope is the one failure this product cannot tolerate, since
 * the file *is* the workspace: a crash mid-write must leave the previous version
 * intact, not a truncated JSON document that no reader will accept.
 *
 * The temp file is created in the destination directory on purpose. A rename
 * across directories is a copy plus a delete on many filesystems, which puts the
 * atomicity back where it started.
 */
export interface AtomicWriteOptions {
    /**
     * Whether to `fsync` the containing directory after the rename. Default
     * `true`; pass `false` where the platform refuses to open a directory handle.
     */
    readonly syncDirectory?: boolean;
}
/** Replace `path` with `bytes`, atomically. */
export declare function writeFileAtomic(path: string, bytes: Uint8Array, options?: AtomicWriteOptions): Promise<void>;
/** Copy `from` over `to`, atomically. Used for a backup, which may be large. */
export declare function copyFileAtomic(from: string, to: string, options?: AtomicWriteOptions): Promise<void>;
/** Move a finished temp file into place, for a writer that already has one. */
export declare function replaceFile(temp: string, path: string): Promise<void>;
//# sourceMappingURL=atomic.d.ts.map