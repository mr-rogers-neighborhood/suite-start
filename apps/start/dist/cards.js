import { workspaceLink } from "@suite/contracts";
import { APP_ICONS } from "./appIcons.js";
import { isNewer, SELF_ID } from "./catalogue.js";
import { UNREPORTED } from "./reportedUpdate.js";
/**
 * Whether an executable is one Start placed.
 *
 * The path is the proof: only installs land under the applications root, so an app there was
 * put there by Start and Start replaces it. Reading that from the disk rather than from the
 * catalogue matters in the moment before the feeds answer — a card that said "from a folder,
 * updates itself" about an app Start installed would be telling a person the opposite of the
 * truth, and inviting them to do the thing that breaks it.
 */
function isManaged(executable, appsRoot) {
    const root = appsRoot.endsWith("/") ? appsRoot : `${appsRoot}/`;
    return executable.startsWith(root);
}
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
 * What one entry can offer, given what this machine actually has.
 *
 * The installed version comes from discovery rather than from the catalogue: discovery is
 * what read the disk, and a catalogue that remembered an install after it was removed
 * would put "up to date" on a card with no version at all.
 */
function stateFor(installedVersion, available) {
    if (installedVersion === null)
        return available !== null ? "not-installed" : "no-release";
    if (available === null)
        return "no-release";
    return isNewer(available, installedVersion) ? "update-available" : "current";
}
export function appCards(input) {
    const refused = input.rejected.map((install) => ({
        id: install.id ?? null,
        name: nameFor(install.path),
        icon: install.id === undefined ? null : (APP_ICONS[install.id] ?? null),
        state: "refused",
        version: null,
        available: null,
        reason: install.reason,
        versions: 0,
        previousVersion: null,
        running: false,
        releases: null,
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
            icon: APP_ICONS[entry.id] ?? null,
            state: stateFor(found === null ? null : found.manifest.version, entry.available),
            version: found?.manifest.version ?? null,
            available: entry.available,
            reason: entry.reason,
            versions: input.versions.get(entry.id) ?? (found === null ? 0 : 1),
            previousVersion: input.previous?.get(entry.id) ?? null,
            running: input.running.has(entry.id),
            releases: entry.releases ?? null,
            channel: found?.manifest.update?.channel ?? entry.channel,
            update: input.updates.get(entry.id) ?? UNREPORTED,
            executable: found?.executable ?? null,
            fileExtensions: found?.manifest.fileExtensions ?? entry.extensions,
            lastOpenedAt: input.recents.find((row) => row.appId === entry.id)?.openedAt ?? null,
            fileCount: input.files.filter((file) => file.appId === entry.id).length,
            health: { ok: true },
        };
    });
    // Discovery found an app the catalogue does not name — either a copy this person placed
    // (D44 makes it first-class) or a managed install whose feed has not answered yet. Only
    // the first is "from a folder"; the second is Start's, and says so.
    const local = [...byId.values()].map((entry) => ({
        id: entry.manifest.id,
        name: entry.manifest.name,
        icon: APP_ICONS[entry.manifest.id] ?? null,
        state: isManaged(entry.executable, input.appsRoot) ? "no-release" : "local",
        version: entry.manifest.version,
        available: null,
        reason: isManaged(entry.executable, input.appsRoot)
            ? "its release feed has not been read yet"
            : null,
        versions: input.versions.get(entry.manifest.id) ?? 1,
        previousVersion: input.previous?.get(entry.manifest.id) ?? null,
        running: input.running.has(entry.manifest.id),
        releases: null,
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
        icon: null,
        state: entry.available === null
            ? "no-release"
            : isNewer(entry.available, version)
                ? "update-available"
                : "current",
        version,
        available: entry.available,
        reason: entry.reason,
        versions: 1,
        previousVersion: null,
        running: false,
        releases: entry.releases ?? null,
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