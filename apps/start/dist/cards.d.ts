import type { CatalogRead } from "./catalog.js";
import type { IndexedFile } from "./fileIndex.js";
import type { RecentEntry } from "./recents.js";
import type { DiscoveredApp, RejectedInstall } from "./registry.js";
import type { AppCard } from "./shared.js";
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
    readonly catalog: CatalogRead;
}
export declare function appCards(input: CardInput): readonly AppCard[];
/** How many cards carry a reason; the number the rail shows. */
export declare function attentionCount(cards: readonly AppCard[]): number;
//# sourceMappingURL=cards.d.ts.map