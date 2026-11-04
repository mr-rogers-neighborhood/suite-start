/**
 * Read a file, refusing before it allocates.
 *
 * An envelope reader is the app's largest single allocation and its most
 * attacker-reachable one: a bundle or a download can name any size. Checking
 * `stat` first means a hostile file costs one syscall rather than the memory it
 * claims to need.
 */
export declare function readFileWithLimit(path: string, maxBytes: number): Promise<Uint8Array>;
/** The text form, for an envelope that is JSON. */
export declare function readTextWithLimit(path: string, maxBytes: number): Promise<string>;
//# sourceMappingURL=read.d.ts.map