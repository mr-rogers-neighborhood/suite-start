import { join } from "node:path";
/**
 * The icon path, or null when this build has none.
 *
 * Null rather than a guess: passing a path that does not exist is the same as passing
 * nothing, minus the honesty. The two builds read from different places because they can
 * — a packaged app has no source tree, and a dev run has no `resources` directory.
 */
export function resolveWindowIcon(options) {
    const exists = options.exists ?? (() => true);
    const candidate = options.isPackaged
        ? join(options.resourcesPath, "icon.png")
        : join(options.appPath, "build", "icon.png");
    return exists(candidate) ? { path: candidate, reason: null } : null;
}
//# sourceMappingURL=windowIcon.js.map