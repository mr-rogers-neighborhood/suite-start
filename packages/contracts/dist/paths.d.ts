/**
 * Where a Suite app keeps its things.
 *
 * This is a **convention**, not a shared store. Three apps writing to one
 * database would recreate the distributed-monolith problem the suite exists to
 * avoid: one schema, one migration, one corruption blast radius. What they share
 * is where a file lives and what it is called, so a person can find their work
 * and a hub can list it without owning it.
 *
 * Two roots, and the split is the decision:
 *
 * - **documents** live under `~/Documents/Suite/<App>`. A person looks there, so a
 *   file can be copied, backed up, or put in a folder their own cloud already
 *   syncs. That is local-first without a relay.
 * - **data** lives in the per-user application directory. Locks and machine-local
 *   state belong here and never beside a document: a lock in a synced folder
 *   carries another machine's process id, and every sync then looks like a
 *   contended file.
 *
 * Backups stay beside the document, because "recover with a file manager when the
 * app is the thing that broke" is a promise an app makes when it writes one.
 *
 * Nothing here touches the filesystem, and nothing imports `node:path`: this
 * module is loaded by a renderer as well as a main process, so it joins strings
 * and leaves the syscalls to `@suite/files/node`.
 */
/** The display name an app uses under `~/Documents/Suite` and in its data directory. */
export type SuiteAppName = "Canvas" | "Planner" | "Budget" | "Start";
export interface SuitePaths {
    /** Where this app's documents live. */
    readonly documents: string;
    /** Machine-local state: locks, caches, and anything that must not sync. */
    readonly data: string;
    /** Where a document's lock file belongs. Always under `data`. */
    readonly locks: string;
}
/**
 * A platform, as `process.platform` spells it.
 *
 * A plain string rather than `NodeJS.Platform`: this package is loaded by a
 * renderer too, so it has no Node types to lean on. The two values that change a
 * path are `darwin` and `win32`; everything else is treated as the XDG convention.
 */
export type SuitePlatform = string;
export interface SuitePathOptions {
    readonly platform: SuitePlatform;
    readonly home: string;
    /** Overrides the documents root: a test, or a portable install. */
    readonly documentsOverride?: string | undefined;
    /** Overrides the data root, for the same reasons. */
    readonly dataOverride?: string | undefined;
    /** `XDG_DATA_HOME`, which the caller reads from the environment. */
    readonly xdgDataHome?: string | undefined;
}
/**
 * Join path parts without importing `node:path`, keeping the platform's separator.
 *
 * A root survives on its own: `/` and `C:\\` are paths, not separators to trim,
 * and losing one would turn an absolute path into a relative one.
 */
export declare function joinPath(platform: SuitePlatform, ...parts: readonly string[]): string;
/**
 * Resolve an app's two roots.
 *
 * An override is never read from a document, so no file can steer a write. It
 * exists for a test and for a portable install, and both are the caller's own
 * decision rather than a document's.
 */
export declare function suitePaths(app: SuiteAppName, options: SuitePathOptions): SuitePaths;
//# sourceMappingURL=paths.d.ts.map