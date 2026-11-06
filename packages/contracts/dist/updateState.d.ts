import { z } from "zod";
import { type ContractParse } from "./parse.js";
/**
 * `suite.update-state` — what an app says about its own updating.
 *
 * The app owns its bytes and its own release feed: it is the only process that
 * may replace its binary, and the only one that talks to its feed. The hub is a
 * reader, so an app writes this file into its own data directory after it has
 * asked, and the hub shows what it finds, including when it was asked.
 *
 * It is deliberately a report rather than a command. Nothing here can make an app
 * update, and nothing here is a version the hub may act on: a stale file is
 * visible as a stale `checkedAt`, which is the honest way to show it.
 */
export declare const SUITE_UPDATE_STATE_FORMAT = "suite.update-state";
/** The file's name inside an app's data directory. */
export declare const SUITE_UPDATE_STATE_FILE = "update-state.json";
export declare const suiteUpdateStateSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.update-state">;
    version: z.ZodString;
    available: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    checkedAt: z.ZodDefault<z.ZodNullable<z.ZodISODateTime>>;
    channel: z.ZodDefault<z.ZodEnum<{
        stable: "stable";
        beta: "beta";
        alpha: "alpha";
    }>>;
}, z.core.$strict>;
export type SuiteUpdateState = z.infer<typeof suiteUpdateStateSchema>;
/** Parse a report read from disk without throwing; a bad file is a "no answer". */
export declare function parseUpdateState(value: unknown): ContractParse<SuiteUpdateState>;
/**
 * True when the report names an update this installation does not have.
 *
 * A plain string comparison is wrong for prereleases (`0.1.0-alpha.10` sorts
 * before `0.1.0-alpha.9`), so this compares numeric segments and treats a
 * prerelease as older than the release it leads to. It is the smallest correct
 * comparison for "is there something newer", not a general semver library.
 */
export declare function updateAvailable(state: SuiteUpdateState): boolean;
//# sourceMappingURL=updateState.d.ts.map