import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import type { InstallRecord } from "./registry.js";

/**
 * The installs Start knows about.
 *
 * A record is the only place an executable path lives. A manifest cannot name
 * one, so a tampered manifest cannot redirect a launch; the worst it can do is
 * describe itself wrongly, and discovery refuses an id that has no record.
 *
 * `installs.json` sits in the data directory, under Start's own name, because it
 * is Start's knowledge rather than any app's.
 */

export const REGISTRY_FILENAME = "installs.json";

export interface RegistryStore {
  readonly path: string;
  list(): Promise<readonly InstallRecord[]>;
  add(record: InstallRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:[\\/])/u;

function parseRecords(value: unknown): readonly InstallRecord[] {
  if (typeof value !== "object" || value === null) return [];
  const apps: unknown = (value as { apps?: unknown }).apps;
  if (!Array.isArray(apps)) return [];

  return apps.flatMap((entry): InstallRecord[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const id: unknown = (entry as { id?: unknown }).id;
    const executable: unknown = (entry as { executable?: unknown }).executable;
    const manifestPath: unknown = (entry as { manifestPath?: unknown }).manifestPath;
    const installedAt: unknown = (entry as { installedAt?: unknown }).installedAt;
    if (typeof id !== "string" || typeof executable !== "string") return [];
    // A relative executable is refused on read, not only on write: a record that
    // arrived from somewhere else is still a path this process would spawn.
    if (!ABSOLUTE_PATH.test(executable)) return [];
    return [
      {
        id,
        executable,
        ...(typeof manifestPath === "string" && isAbsolute(manifestPath) ? { manifestPath } : {}),
        ...(typeof installedAt === "string" ? { installedAt } : {}),
      },
    ];
  });
}

export function registryStore(dataDirectory: string): RegistryStore {
  const path = join(dataDirectory, REGISTRY_FILENAME);

  async function write(records: readonly InstallRecord[]): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const temp = `${path}.tmp`;
    await writeFile(temp, JSON.stringify({ apps: records }, null, 2));
    await rename(temp, path);
  }

  return {
    path,
    async list() {
      try {
        return parseRecords(JSON.parse(await readFile(path, "utf8")));
      } catch {
        return [];
      }
    },
    async add(record) {
      if (!ABSOLUTE_PATH.test(record.executable)) {
        throw new Error("an install record names an absolute executable");
      }
      const existing = await this.list();
      await write([...existing.filter((item) => item.id !== record.id), record]);
    },
    async remove(id) {
      await write((await this.list()).filter((item) => item.id !== id));
    },
  };
}
