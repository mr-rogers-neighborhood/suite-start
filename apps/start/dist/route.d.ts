import type { DeepLinkRejection } from "@suite/contracts";
import { type DiscoveredApp } from "./registry.js";
/**
 * Turn whatever the operating system handed us into a process to start.
 *
 * The input is untrusted by construction: a desktop file, a browser, a second
 * copy of Start, or a drag-and-drop can all hand over a string. Routing is
 * therefore a decision about *which installed app* and *what arguments*, and it
 * refuses rather than guesses. Nothing here spawns anything, which is why every
 * rule below is a test.
 */
export type RouteRejection = DeepLinkRejection | "empty-target"
/** Not an absolute path, or one containing a `..` segment. */
 | "not-a-path" | "unknown-extension" | "app-not-installed";
export interface LaunchPlan {
    readonly app: DiscoveredApp;
    /** Arguments in order, after the executable. */
    readonly argv: readonly string[];
    readonly why: "deep-link" | "file";
}
export type RouteResult = {
    readonly ok: true;
    readonly plan: LaunchPlan;
} | {
    readonly ok: false;
    readonly reason: RouteRejection;
};
/** The extension a path claims, lower-case and without the dot; null when it has none. */
export declare function extensionOf(path: string): string | null;
/** True for an absolute path that does not try to climb out of where it claims to be. */
export declare function isRoutablePath(path: string): boolean;
/**
 * Route one target against the installed apps.
 *
 * A deep link is canonicalised before it becomes an argument: the app receives a
 * link in the one shape the suite defines, not whatever spelling arrived.
 */
export declare function routeLaunch(target: string, apps: readonly DiscoveredApp[]): RouteResult;
/** What to execute for a plan. Separated so a launcher can log or dry-run it. */
export declare function spawnCommand(plan: LaunchPlan): {
    readonly command: string;
    readonly args: readonly string[];
};
/** One sentence for a refusal, for a dialog or a log line. */
export declare function describeRouteRejection(reason: RouteRejection): string;
//# sourceMappingURL=route.d.ts.map