import { workspaceLink } from "@suite/contracts";
import { SELF_ID } from "./catalogue.js";
import { UNREPORTED } from "./reportedUpdate.js";
/** The folder name a refused install is known by. */
function nameFor(path) {
    const segments = path.split(/[\\/]+/u).filter((segment) => segment.length > 0);
    const last = segments.at(-1);
    const parent = segments.at(-2);
    if (last === "suite.app.json" && parent !== undefined)
        return parent;
    return last ?? path;
}
/**
 * What one catalogue entry can offer.
 *
 * Installed and the feed is ahead: an update. Installed and the feed agrees, or says
 * nothing: Open either way, with the card saying which. Not installed: Install when
 * something verified exists to install, and no button when nothing does.
 */
function stateFor(entry) {
    const installed = entry.installed !== null;
    if (!installed)
        return entry.available !== null ? "not-installed" : "no-release";
    if (entry.available === null)
        return "no-release";
    return entry.newer ? "update-available" : "current";
}
export function appCards(input) {
    const refused = input.rejected.map((install) => ({
        id: install.id ?? null,
        name: nameFor(install.path),
        state: "refused",
        version: null,
        available: null,
        reason: install.reason,
        versions: 0,
        channel: "stable",
        update: UNREPORTED,
        executable: null,
        fileExtensions: [],
        lastOpenedAt: null,
        fileCount: 0,
        health: { ok: false, reason: install.reason },
    }));
    const byId = new Map(input.apps.map((app) => [app.manifest.id, app]));
    const offered = input.catalogue
        .filter((entry) => entry.id !== SELF_ID)
        .map((entry) => {
        const found = byId.get(entry.id) ?? null;
        byId.delete(entry.id);
        return {
            id: entry.id,
            name: found?.manifest.name ?? entry.name,
            state: stateFor(entry),
            version: found?.manifest.version ?? null,
            available: entry.available,
            reason: entry.reason,
            versions: input.versions.get(entry.id) ?? (found === null ? 0 : 1),
            channel: found?.manifest.update?.channel ?? entry.channel,
            update: input.updates.get(entry.id) ?? UNREPORTED,
            executable: found?.executable ?? null,
            fileExtensions: found?.manifest.fileExtensions ?? entry.extensions,
            lastOpenedAt: input.recents.find((row) => row.appId === entry.id)?.openedAt ?? null,
            fileCount: input.files.filter((file) => file.appId === entry.id).length,
            health: { ok: true },
        };
    });
    // Whatever discovery found that the catalogue does not name: an app this person built
    // or installed themselves. D44 makes it first-class, so it keeps its card.
    const local = [...byId.values()].map((entry) => ({
        id: entry.manifest.id,
        name: entry.manifest.name,
        state: "local",
        version: entry.manifest.version,
        available: null,
        reason: null,
        versions: input.versions.get(entry.manifest.id) ?? 1,
        channel: entry.manifest.update?.channel ?? "stable",
        update: input.updates.get(entry.manifest.id) ?? UNREPORTED,
        executable: entry.executable,
        fileExtensions: entry.manifest.fileExtensions,
        lastOpenedAt: input.recents.find((row) => row.appId === entry.manifest.id)?.openedAt ?? null,
        fileCount: input.files.filter((file) => file.appId === entry.manifest.id).length,
        health: { ok: true },
    }));
    return [...refused, ...offered, ...local];
}
/**
 * The hub's own row: a fact rather than a button.
 *
 * Start cannot replace its own running binary, so the row says what version it is
 * running and what its feed offers, and offers nothing to press.
 */
export function selfCard(entry, version) {
    return {
        id: SELF_ID,
        name: entry.name,
        state: entry.available === null ? "no-release" : "current",
        version,
        available: entry.available,
        reason: entry.reason,
        versions: 1,
        channel: entry.channel,
        update: UNREPORTED,
        executable: null,
        fileExtensions: [],
        lastOpenedAt: null,
        fileCount: 0,
        health: { ok: true },
    };
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