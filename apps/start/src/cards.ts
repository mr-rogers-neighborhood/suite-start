import { workspaceLink } from "@suite/contracts";
import { type CatalogueApp, isNewer, SELF_ID } from "./catalogue.js";
import type { IndexedFile } from "./fileIndex.js";
import type { RecentEntry } from "./recents.js";
import type { DiscoveredApp, RejectedInstall } from "./registry.js";
import { type ReportedUpdate, UNREPORTED } from "./reportedUpdate.js";
import type { AppCard, AppCardState, FileCard } from "./shared.js";

/**
 * One card per app the suite offers, one per app it does not know, and one per
 * install that cannot be used.
 *
 * A card used to exist only for what discovery found, which made a new machine an
 * empty window — the one answer a front door cannot give. So the catalogue decides
 * which cards exist, and discovery decides what each one says about being installed.
 *
 * A refused install is still a card rather than a second list, because the question a
 * person asks is "what do I have?", and "an app that will not start" belongs in the
 * answer. What is wrong with it is a line on the card, and a card with no launch button
 * is honest where a dead button is not.
 */
export interface CardInput {
  readonly apps: readonly DiscoveredApp[];
  readonly rejected: readonly RejectedInstall[];
  readonly files: readonly IndexedFile[];
  readonly recents: readonly RecentEntry[];
  /** What each app reported about its own updating, by app id. */
  readonly updates: ReadonlyMap<string, ReportedUpdate>;
  /** What the suite offers, installed or not. The hub's own row is not a card. */
  readonly catalogue: readonly CatalogueApp[];
  /** How many version directories each app has on disk, by app id. */
  readonly versions: ReadonlyMap<string, number>;
}

/** The folder name a refused install is known by. */
function nameFor(path: string): string {
  const segments = path.split(/[\\/]+/u).filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  const parent = segments.at(-2);
  if (last === "suite.app.json" && parent !== undefined) return parent;
  return last ?? path;
}

/**
 * What one catalogue entry can offer.
 *
 * Installed and the feed is ahead: an update. Installed and the feed agrees, or says
 * nothing: Open either way, with the card saying which. Not installed: Install when
 * something verified exists to install, and no button when nothing does.
 */
function stateFor(entry: CatalogueApp): AppCardState {
  const installed = entry.installed !== null;
  if (!installed) return entry.available !== null ? "not-installed" : "no-release";
  if (entry.available === null) return "no-release";
  return entry.newer ? "update-available" : "current";
}

export function appCards(input: CardInput): readonly AppCard[] {
  const refused: AppCard[] = input.rejected.map((install) => ({
    id: install.id ?? null,
    name: nameFor(install.path),
    state: "refused",
    version: null,
    available: null,
    reason: install.reason,
    versions: 0,
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

  const offered: AppCard[] = input.catalogue
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

  // Whatever discovery found that the catalogue does not name: an app this person built
  // or installed themselves. D44 makes it first-class, so it keeps its card.
  const local: AppCard[] = [...byId.values()].map((entry) => ({
    id: entry.manifest.id,
    name: entry.manifest.name,
    state: "local",
    version: entry.manifest.version,
    available: null,
    reason: null,
    versions: input.versions.get(entry.manifest.id) ?? 1,
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
export function selfCard(entry: CatalogueApp, version: string): AppCard {
  return {
    id: SELF_ID,
    name: entry.name,
    state:
      entry.available === null
        ? "no-release"
        : isNewer(entry.available, version)
          ? "update-available"
          : "current",
    version,
    available: entry.available,
    reason: entry.reason,
    versions: 1,
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
export function attentionCount(cards: readonly AppCard[]): number {
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
export function fileCards(files: readonly IndexedFile[]): readonly FileCard[] {
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
