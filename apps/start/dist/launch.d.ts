import type { LaunchPlan } from "./route.js";
/**
 * Start a process and let go of it.
 *
 * Start is a launcher, so the child must outlive it: detached, no inherited
 * stdio, and `unref` so Start's own event loop can exit. The executable comes
 * from an install record that discovery already checked for an absolute path;
 * the arguments come from a plan that already passed routing.
 */
export declare function launchPlan(plan: LaunchPlan): number | null;
//# sourceMappingURL=launch.d.ts.map