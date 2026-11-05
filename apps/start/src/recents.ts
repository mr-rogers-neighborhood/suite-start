import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Start's own recent-files list.
 *
 * It belongs to Start rather than to an app, because it spans them: "the thing I
 * opened last" is a hub question. Each app keeps its own library and its own
 * recents; this is a second list, not the same one, and nothing reconciles them,
 * so no party can overwrite another's idea of history.
 *
 * The file is a cache of convenience. A missing or unreadable one is an empty
 * list, never an error, because a launcher that will not start over its own
 * history is worse than one that has forgotten it.
 */

export interface RecentEntry {
  /** Absolute path of the file that was opened. */
  readonly path: string;
  /** The app it opened in, so a missing app can be named rather than guessed. */
  readonly appId: string;
  readonly openedAt: number;
}

/** How many entries Start keeps. Enough to see a week of work, short enough to scan. */
export const RECENT_LIMIT = 20;

export interface RecentsFile {
  readonly path: string;
  list(): Promise<readonly RecentEntry[]>;
  remember(entry: Omit<RecentEntry, "openedAt">): Promise<void>;
  forget(path: string): Promise<void>;
}

function isEntry(value: unknown): value is RecentEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.path === "string" &&
    typeof entry.appId === "string" &&
    typeof entry.openedAt === "number"
  );
}

function parse(text: string): readonly RecentEntry[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((left, right) => right.openedAt - left.openedAt);
  } catch {
    return [];
  }
}

export function recentsFile(dataDirectory: string): RecentsFile {
  const path = join(dataDirectory, "recents.json");

  async function write(entries: readonly RecentEntry[]): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    // Temp then rename: a launcher that crashes mid-write keeps its history.
    const temp = `${path}.tmp`;
    await writeFile(temp, JSON.stringify(entries.slice(0, RECENT_LIMIT), null, 2));
    await rename(temp, path);
  }

  return {
    path,
    async list() {
      try {
        return parse(await readFile(path, "utf8"));
      } catch {
        return [];
      }
    },
    async remember(entry) {
      const existing = await this.list();
      const next: RecentEntry[] = [
        { ...entry, openedAt: Date.now() },
        // One row per path: reopening a file moves it to the top rather than
        // listing it twice.
        ...existing.filter((item) => item.path !== entry.path),
      ];
      await write(next);
    },
    async forget(path) {
      await write((await this.list()).filter((item) => item.path !== path));
    },
  };
}
