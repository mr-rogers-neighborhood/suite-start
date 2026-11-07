import { z } from "zod";
import { type ContractParse } from "./parse.js";
import type { SuitePathOptions } from "./paths.js";
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
export declare const SUITE_HUB_FORMAT = "suite.hub";
/** The file's name inside the hub's data directory. */
export declare const SUITE_HUB_FILE = "hub.json";
export declare const suiteHubScopeSchema: z.ZodEnum<{
    loopback: "loopback";
    network: "network";
}>;
export type SuiteHubScope = z.infer<typeof suiteHubScopeSchema>;
export declare const suiteHubSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.hub">;
    running: z.ZodBoolean;
    scope: z.ZodEnum<{
        loopback: "loopback";
        network: "network";
    }>;
    port: z.ZodNumber;
    address: z.ZodNullable<z.ZodString>;
    startedAt: z.ZodNullable<z.ZodISODateTime>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type SuiteHub = z.infer<typeof suiteHubSchema>;
/** Parse a hub report read from disk without throwing; a bad file is a "no answer". */
export declare function parseHubState(value: unknown): ContractParse<SuiteHub>;
/**
 * Where the hub's report lives, given the same path options every app resolves with.
 *
 * Named rather than remembered: a reader that hard-coded `~/.local/share/suite/start` would be
 * right on one platform and wrong on two.
 */
export declare function hubReportPath(options: SuitePathOptions): string;
//# sourceMappingURL=hub.d.ts.map