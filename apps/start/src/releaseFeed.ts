import { SUITE_UPDATE_STATE_FILE } from "@suite/contracts";
import { checkSignedFeed, type FeedCheck, type FeedFetch } from "@suite/desktop";

/**
 * Reading an app's release feed, on demand, through the shared reader.
 *
 * The hub and the app must agree about what is newest, so they read the same file
 * with the same parser, and the same signature check decides whether the answer is
 * the publisher's. A second implementation here would be a second opinion about a
 * version, which is the one thing the hub must not have.
 */
/** Alias, so the hub's call sites read as "check this feed". */
export { checkSignedFeed as checkFeed, type FeedCheck, type FeedFetch, SUITE_UPDATE_STATE_FILE };
