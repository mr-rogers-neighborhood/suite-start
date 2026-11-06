import { workspaceLink } from "@suite/contracts";
import type { IndexedFile } from "./fileIndex.js";
import type { RecentEntry } from "./recents.js";
import type { DiscoveredApp, RejectedInstall } from "./registry.js";
import { type ReportedUpdate, UNREPORTED } from "./reportedUpdate.js";
import type { AppCard, FileCard } from "./shared.js";

/**
 * One card per app, and one per install that cannot be used.
 *
 * A refused install is a card rather than a second list because the question a
 * person asks is "what do I have?", and "an app that will not start" belongs in
 * the answer. What is wrong with it is a line on the card, and a card with no
 * launch button is honest where a dead button is not.
 */
export interface CardInput {
  readonly apps: readonly DiscoveredApp[];
  readonly rejected: readonly RejectedInstall[];
  readonly files: readonly IndexedFile[];
  readonly recents: readonly RecentEntry[];
  /** What each app reported about its own updating, by app id. */
  readonly updates: ReadonlyMap<string, ReportedUpdate>;
}

/** The folder name a refused install is known by. */
function nameFor(path: string): string {
  const segments = path.split(/[\\/]+/u).filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  const parent = segments.at(-2);
  if (last === "suite.app.json" && parent !== undefined) return parent;
  return last ?? path;
}

export function appCards(input: CardInput): readonly AppCard[] {
  const installed: AppCard[] = input.apps.map((entry) => {
    const channel = entry.manifest.update?.channel ?? "stable";
    return {
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      channel,
      update: input.updates.get(entry.manifest.id) ?? UNREPORTED,
      executable: entry.executable,
      fileExtensions: entry.manifest.fileExtensions,
      lastOpenedAt: input.recents.find((row) => row.appId === entry.manifest.id)?.openedAt ?? null,
      fileCount: input.files.filter((file) => file.appId === entry.manifest.id).length,
      health: { ok: true },
    };
  });

  const refused: AppCard[] = input.rejected.map((install) => ({
    id: install.id ?? null,
    name: nameFor(install.path),
    version: "unknown",
    channel: "stable",
    update: UNREPORTED,
    executable: null,
    fileExtensions: [],
    lastOpenedAt: null,
    fileCount: 0,
    health: { ok: false, reason: install.reason },
  }));

  return [...installed, ...refused];
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
