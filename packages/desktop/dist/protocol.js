import { join, sep } from "node:path";
// biome-ignore lint/suspicious/noControlCharactersInRegex: a NUL in a path is never legitimate.
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;
export function resolveProtocolAsset(requestUrl, root, options) {
    const prefix = `${options.scheme.toLowerCase()}://`;
    if (!requestUrl.toLowerCase().startsWith(prefix))
        return { ok: false };
    const afterOrigin = requestUrl.slice(prefix.length);
    const slash = afterOrigin.indexOf("/");
    const host = (slash < 0 ? afterOrigin : afterOrigin.slice(0, slash)).toLowerCase();
    if (!options.hosts.includes(host))
        return { ok: false };
    const rawPath = slash < 0 ? "" : afterOrigin.slice(slash);
    const stops = [rawPath.indexOf("?"), rawPath.indexOf("#")].filter((index) => index >= 0);
    const pathOnly = stops.length > 0 ? rawPath.slice(0, Math.min(...stops)) : rawPath;
    const segments = [];
    for (const raw of pathOnly.split("/")) {
        if (raw === "")
            continue;
        let segment;
        try {
            segment = decodeURIComponent(raw);
        }
        catch {
            return { ok: false };
        }
        if (segment === "." || segment === "..")
            return { ok: false };
        if (segment.includes("/") || segment.includes("\\"))
            return { ok: false };
        if (segment.length === 0 || CONTROL_CHARACTER.test(segment))
            return { ok: false };
        segments.push(segment);
    }
    const relative = segments.length > 0 ? segments.join("/") : (options.entry ?? "index.html");
    const file = join(root, relative);
    // Defence in depth: whatever the segments were, the resolved path must sit
    // under the bundle, tested on a separator boundary so a sibling directory
    // sharing the prefix is not mistaken for the root.
    const directory = root.endsWith(sep) ? root.slice(0, -1) : root;
    if (file !== directory && !file.startsWith(`${directory}${sep}`))
        return { ok: false };
    return { ok: true, file };
}
//# sourceMappingURL=protocol.js.map