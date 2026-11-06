import { catalogState, findReleaseEntry, workspaceLink } from "@suite/contracts";
/** The folder name a refused install is known by. */
function nameFor(path) {
    const segments = path.split(/[\\/]+/u).filter((segment) => segment.length > 0);
    const last = segments.at(-1);
    const parent = segments.at(-2);
    if (last === "suite.app.json" && parent !== undefined)
        return parent;
    return last ?? path;
}
export function appCards(input) {
    const installed = input.apps.map((entry) => {
        const channel = entry.manifest.update?.channel ?? "stable";
        const release = input.catalog.state === "configured"
            ? findReleaseEntry(input.catalog.catalog, entry.manifest.id, channel)
            : null;
        return {
            id: entry.manifest.id,
            name: entry.manifest.name,
            version: entry.manifest.version,
            channel,
            update: catalogState(release, entry.manifest.version),
            executable: entry.executable,
            fileExtensions: entry.manifest.fileExtensions,
            lastOpenedAt: input.recents.find((row) => row.appId === entry.manifest.id)?.openedAt ?? null,
            fileCount: input.files.filter((file) => file.appId === entry.manifest.id).length,
            health: { ok: true },
        };
    });
    const refused = input.rejected.map((install) => ({
        id: install.id ?? null,
        name: nameFor(install.path),
        version: "unknown",
        channel: "stable",
        update: "unknown",
        executable: null,
        fileExtensions: [],
        lastOpenedAt: null,
        fileCount: 0,
        health: { ok: false, reason: install.reason },
    }));
    return [...installed, ...refused];
}
/** How many cards carry a reason; the number the rail shows. */
export function attentionCount(cards) {
    return cards.filter((card) => !card.health.ok).length;
}
/**
 * One row per indexed document, with the link that opens it.
 *
 * The link is built here rather than in the renderer so the shape has exactly one
 * author — `workspaceLink` in the contract — and so the hub cannot invent a link
 * an app would refuse. A name the builder refuses carries no link, and the row
 * simply does not offer one.
 */
export function fileCards(files) {
    return files.map((file) => ({
        path: file.path,
        name: file.name,
        appId: file.appId,
        appName: file.appName,
        folder: file.folder,
        modifiedAt: file.modifiedAt,
        installed: file.installed,
        link: workspaceLink(file.appId, file.name),
    }));
}
//# sourceMappingURL=cards.js.map