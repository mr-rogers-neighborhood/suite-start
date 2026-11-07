/**
 * Where a Suite app keeps its things.
 *
 * This is a **convention**, not a shared store. Three apps writing to one
 * database would recreate the distributed-monolith problem the suite exists to
 * avoid: one schema, one migration, one corruption blast radius. What they share
 * is where a file lives and what it is called, so a person can find their work
 * and a hub can list it without owning it.
 *
 * Three roots, and the split is the decision:
 *
 * - **documents** live under `~/Documents/Suite/<App>`. A person looks there, so a
 *   file can be copied, backed up, or put in a folder their own cloud already
 *   syncs. That is local-first without a relay.
 * - **data** lives in the per-user application directory. Locks and machine-local
 *   state belong here and never beside a document: a lock in a synced folder
 *   carries another machine's process id, and every sync then looks like a
 *   contended file.
 * - **applications** live under `~/Applications/Suite/<App>/<version>`. An install
 *   is neither a document nor state: it is the app itself, replaced wholesale by a
 *   newer version, so it gets a root of its own rather than sharing either.
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
  /**
   * Where Start installs apps, one folder per app and version under it.
   *
   * Suite-wide rather than per app: it is the same root for every app, and an app
   * reads it only to know where its own install was placed.
   */
  readonly applications: string;
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
  /** Overrides the applications root, for the same reasons. */
  readonly applicationsOverride?: string | undefined;
  /** `XDG_DATA_HOME`, which the caller reads from the environment. */
  readonly xdgDataHome?: string | undefined;
}

function separator(platform: SuitePlatform): string {
  return platform === "win32" ? "\\" : "/";
}

/**
 * Join path parts without importing `node:path`, keeping the platform's separator.
 *
 * A root survives on its own: `/` and `C:\\` are paths, not separators to trim,
 * and losing one would turn an absolute path into a relative one.
 */
export function joinPath(platform: SuitePlatform, ...parts: readonly string[]): string {
  const sep = separator(platform);
  const leading = new RegExp(`^\\${sep}+`, "u");
  let joined = "";
  for (const part of parts) {
    if (part.length === 0) continue;
    if (joined.length === 0) {
      joined = part;
      continue;
    }
    const left = joined.endsWith(sep) ? joined.slice(0, -1) : joined;
    joined = `${left}${sep}${part.replace(leading, "")}`;
  }
  return joined;
}

function dataRoot(app: SuiteAppName, options: SuitePathOptions): string {
  const { platform } = options;
  const folder = `Suite ${app}`;
  if (platform === "darwin") {
    return joinPath(platform, options.home, "Library", "Application Support", folder);
  }
  if (platform === "win32") {
    return joinPath(platform, options.home, "AppData", "Roaming", folder);
  }
  const base =
    options.xdgDataHome && options.xdgDataHome.length > 0
      ? options.xdgDataHome
      : joinPath(platform, options.home, ".local", "share");
  return joinPath(platform, base, "suite", app.toLowerCase());
}

/**
 * The root every install sits under.
 *
 * One convention on every platform, because D46 named one: `~/Applications/Suite`.
 * An override exists for a test and for a portable install, and it is never read
 * from a document, so no file can steer where an install lands.
 */
export function suiteApplicationsRoot(
  platform: SuitePlatform,
  home: string,
  rootOverride?: string | undefined,
): string {
  const named = rootOverride?.trim();
  if (named !== undefined && named.length > 0) return named;
  return joinPath(platform, home, "Applications", "Suite");
}

/**
 * Resolve an app's three roots.
 *
 * An override is never read from a document, so no file can steer a write. It
 * exists for a test and for a portable install, and both are the caller's own
 * decision rather than a document's.
 */
export function suitePaths(app: SuiteAppName, options: SuitePathOptions): SuitePaths {
  const { platform } = options;
  const documents =
    options.documentsOverride?.trim() ||
    joinPath(platform, options.home, "Documents", "Suite", app);
  const data = options.dataOverride?.trim() || dataRoot(app, options);
  return {
    documents,
    data,
    applications: suiteApplicationsRoot(platform, options.home, options.applicationsOverride),
    locks: joinPath(platform, data, "locks"),
  };
}
