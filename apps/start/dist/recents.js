import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
/** How many entries Start keeps. Enough to see a week of work, short enough to scan. */
export const RECENT_LIMIT = 20;
function isEntry(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const entry = value;
    return (typeof entry.path === "string" &&
        typeof entry.appId === "string" &&
        typeof entry.openedAt === "number");
}
function parse(text) {
    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isEntry).sort((left, right) => right.openedAt - left.openedAt);
    }
    catch {
        return [];
    }
}
export function recentsFile(dataDirectory) {
    const path = join(dataDirectory, "recents.json");
    async function write(entries) {
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
            }
            catch {
                return [];
            }
        },
        async remember(entry) {
            const existing = await this.list();
            const next = [
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
//# sourceMappingURL=recents.js.map