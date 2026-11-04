import { formatDeepLink, parseDeepLink } from "@suite/contracts";
import { appById, appForExtension } from "./registry.js";
const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:[\\/])/u;
const DEEP_LINK = /^suite:/iu;
/** The extension a path claims, lower-case and without the dot; null when it has none. */
export function extensionOf(path) {
    const separator = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    const name = separator < 0 ? path : path.slice(separator + 1);
    const dot = name.lastIndexOf(".");
    if (dot <= 0 || dot === name.length - 1)
        return null;
    return name.slice(dot + 1).toLowerCase();
}
/** True for an absolute path that does not try to climb out of where it claims to be. */
export function isRoutablePath(path) {
    if (!ABSOLUTE_PATH.test(path))
        return false;
    const segments = path.split(/[\\/]+/u);
    return !segments.includes("..");
}
/**
 * Route one target against the installed apps.
 *
 * A deep link is canonicalised before it becomes an argument: the app receives a
 * link in the one shape the suite defines, not whatever spelling arrived.
 */
export function routeLaunch(target, apps) {
    const trimmed = target.trim();
    if (trimmed === "")
        return { ok: false, reason: "empty-target" };
    if (DEEP_LINK.test(trimmed)) {
        const parsed = parseDeepLink(trimmed, { apps: apps.map((app) => app.manifest.id) });
        if (!parsed.ok)
            return { ok: false, reason: parsed.reason };
        const app = appById(apps, parsed.value.app);
        if (!app)
            return { ok: false, reason: "app-not-installed" };
        const canonical = formatDeepLink(parsed.value.app, parsed.value.segments, parsed.value.query);
        if (canonical === null)
            return { ok: false, reason: "unsafe-segment" };
        return { ok: true, plan: { app, argv: [canonical], why: "deep-link" } };
    }
    if (!isRoutablePath(trimmed))
        return { ok: false, reason: "not-a-path" };
    const extension = extensionOf(trimmed);
    if (extension === null)
        return { ok: false, reason: "unknown-extension" };
    const app = appForExtension(apps, extension);
    if (!app)
        return { ok: false, reason: "unknown-extension" };
    return { ok: true, plan: { app, argv: [trimmed], why: "file" } };
}
/** What to execute for a plan. Separated so a launcher can log or dry-run it. */
export function spawnCommand(plan) {
    return { command: plan.app.executable, args: plan.argv };
}
/** One sentence for a refusal, for a dialog or a log line. */
export function describeRouteRejection(reason) {
    switch (reason) {
        case "empty-target":
            return "Nothing to open.";
        case "not-a-path":
            return "That is not an absolute path this launcher will hand to an app.";
        case "unknown-extension":
            return "No installed Suite app opens that kind of file.";
        case "app-not-installed":
            return "That link names an app that is not installed. Open Suite Start to install it.";
        case "unknown-app":
            return "That link does not name an app this launcher knows about.";
        case "not-a-suite-url":
            return "That is not a Suite link.";
        case "credentials-or-port":
            return "That Suite link carries credentials or a port, which is never legitimate.";
        case "fragment-not-supported":
            return "That Suite link carries a fragment, which this launcher does not accept.";
        case "unsafe-segment":
            return "That Suite link contains a path fragment this launcher refuses.";
        case "too-many-segments":
            return "That Suite link is longer than this launcher accepts.";
    }
}
//# sourceMappingURL=route.js.map