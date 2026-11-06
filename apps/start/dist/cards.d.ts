import type { IndexedFile } from "./fileIndex.js";
import type { RecentEntry } from "./recents.js";
import type { DiscoveredApp, RejectedInstall } from "./registry.js";
import { type ReportedUpdate } from "./reportedUpdate.js";
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
export declare function appCards(input: CardInput): readonly AppCard[];
/** How many cards carry a reason; the number the rail shows. */
export declare function attentionCount(cards: readonly AppCard[]): number;
/**
 * One row per indexed document, with the link that opens it.
 *
 * The link is built here rather than in the renderer so the shape has exactly one
 * author — `workspaceLink` in the contract — and so the hub cannot invent a link
 * an app would refuse. A name the builder refuses carries no link, and the row
 * simply does not offer one.
 */
export declare function fileCards(files: readonly IndexedFile[]): readonly FileCard[];
//# sourceMappingURL=cards.d.ts.map