import { joinPath, suitePaths } from "./paths.js";
export const SUITE_APPS = [
    { id: "canvas", name: "Canvas", folder: "Canvas", extension: "canvas" },
    { id: "planner", name: "Planner", folder: "Planner", extension: "planner" },
    { id: "budget", name: "Budget", folder: "Budget", extension: "budget" },
];
/**
 * The root every app's documents folder sits under.
 *
 * An override exists for a test and a portable install. It is never read from a
 * document, so no file can steer where Start looks.
 */
export function suiteDocumentsRoot(platform, home, rootOverride) {
    const named = rootOverride?.trim();
    if (named !== undefined && named.length > 0)
        return named;
    return joinPath(platform, home, "Documents", "Suite");
}
/** One app's documents folder, with the root and the folder resolved together. */
export function appDocumentsFolder(entry, options) {
    const root = options.rootOverride?.trim();
    if (root !== undefined && root.length > 0) {
        return joinPath(options.platform, root, entry.folder);
    }
    return suitePaths(entry.folder, options).documents;
}
//# sourceMappingURL=suiteApps.js.map