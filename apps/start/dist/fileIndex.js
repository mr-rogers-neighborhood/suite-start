import { join } from "node:path";
import { extensionOf, isRoutablePath } from "./route.js";
/**
 * The index of every app's documents.
 *
 * Start lists files; it does not own them. No name, no pin and no last-board is
 * stored here, because a second list that disagrees with the app's own would be
 * worse than no list at all. Opening a file is the only thing a row offers.
 *
 * The filesystem is a port, so the rules below are a test rather than a fixture
 * directory, and the read is per folder and top level only: a person with
 * thousands of files pays for names and stats, not for a walk.
 */
/** Enough rows to be useful and few enough to render without a virtual list. */
export const INDEX_LIMIT = 500;
/**
 * Name, app, folder and modification time for every matching file.
 *
 * A folder that does not exist yet is normal on a fresh machine, so it is
 * skipped rather than reported: an empty index is the truth, not a failure.
 */
export async function indexDocuments(folders, fileSystem, installedAppIds) {
    const found = [];
    for (const { app, path } of folders) {
        let names;
        try {
            names = await fileSystem.listFiles(path);
        }
        catch {
            continue;
        }
        for (const name of names) {
            if (extensionOf(name) !== app.extension)
                continue;
            const full = join(path, name);
            let modifiedAt = 0;
            try {
                modifiedAt = await fileSystem.modifiedAt(full);
            }
            catch {
                // A file that vanished between the listing and the stat is not an entry.
                continue;
            }
            found.push({
                path: full,
                name,
                appId: app.id,
                appName: app.name,
                folder: app.folder,
                modifiedAt,
                installed: installedAppIds.has(app.id),
            });
        }
    }
    return found.sort((left, right) => right.modifiedAt - left.modifiedAt).slice(0, INDEX_LIMIT);
}
function normalise(value) {
    return value.replace(/\\/gu, "/");
}
/**
 * Whether a path the page asked to open is inside one of the indexed folders.
 *
 * `openFile` is the one channel that takes a path, and this is the guard: the
 * page may only ask for something Start itself just listed.
 */
export function isInsideDocuments(path, folders) {
    if (!isRoutablePath(path))
        return false;
    const wanted = normalise(path);
    return folders.some((folder) => {
        const root = normalise(folder).replace(/\/+$/u, "");
        return wanted.startsWith(`${root}/`);
    });
}
//# sourceMappingURL=fileIndex.js.map