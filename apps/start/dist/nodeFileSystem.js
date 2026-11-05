import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
/**
 * The real filesystem behind the two ports.
 *
 * Small on purpose: discovery needs to list a directory and read one file, the
 * index needs the files in a folder and their times. Keeping it to that is what
 * lets the hub's rules be tested without touching a disk.
 */
export function nodeRegistryFileSystem() {
    return {
        async readText(path) {
            return readFile(path, "utf8");
        },
        async listDirectories(path) {
            const entries = await readdir(path, { withFileTypes: true });
            return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
        },
        async listFiles(path) {
            const entries = await readdir(path, { withFileTypes: true });
            return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
        },
        async modifiedAt(path) {
            const stats = await stat(path);
            return stats.mtimeMs;
        },
    };
}
/** Where an install's directory roots live for this platform. */
export function defaultRoots(home, platform) {
    // Data goes under the XDG/Apple/Windows convention; the hub only ever reads a
    // manifest out of here, never a document.
    if (platform === "darwin")
        return [join(home, "Library", "Application Support", "Suite", "apps")];
    if (platform === "win32")
        return [join(home, "AppData", "Roaming", "Suite", "apps")];
    return [join(home, ".local", "share", "suite", "apps"), "/usr/lib/suite/apps"];
}
//# sourceMappingURL=nodeFileSystem.js.map