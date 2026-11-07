import { z } from "zod";
import { parseWith } from "./parse.js";
import { joinPath, suitePaths } from "./paths.js";
/**
 * `suite.hub` — what the hub says about where it can be reached.
 *
 * The hub knows two things no app can work out for itself: whether it is running, and the
 * address a *device* would be given. That address is not the one the listener is bound to —
 * a host on `0.0.0.0` is reachable at an interface address, and only the machine knows which
 * one — so an app that guessed would hand out a link that works nowhere.
 *
 * This is the `suite.update-state` pattern rather than a shared store: the hub writes a report
 * about itself into its own data directory, and any app that needs it reads it. Nothing can
 * make the hub do anything by writing this file, and a stale report is visible as a stale
 * `updatedAt`.
 */
export const SUITE_HUB_FORMAT = "suite.hub";
/** The file's name inside the hub's data directory. */
export const SUITE_HUB_FILE = "hub.json";
export const suiteHubScopeSchema = z.enum(["loopback", "network"]);
export const suiteHubSchema = z
    .object({
    format: z.literal(SUITE_HUB_FORMAT),
    running: z.boolean(),
    scope: suiteHubScopeSchema,
    port: z.number().int().positive(),
    /** The `ws://` address another device would be given, or null while the hub is stopped. */
    address: z.string().min(1).nullable(),
    /** When the hub last started, so a reader can tell a restart from a long life. */
    startedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
})
    .strict();
/** Parse a hub report read from disk without throwing; a bad file is a "no answer". */
export function parseHubState(value) {
    return parseWith(suiteHubSchema, value);
}
/**
 * Where the hub's report lives, given the same path options every app resolves with.
 *
 * Named rather than remembered: a reader that hard-coded `~/.local/share/suite/start` would be
 * right on one platform and wrong on two.
 */
export function hubReportPath(options) {
    return joinPath(options.platform, suitePaths("Start", options).data, SUITE_HUB_FILE);
}
//# sourceMappingURL=hub.js.map