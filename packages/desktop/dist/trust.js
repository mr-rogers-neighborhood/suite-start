/**
 * Is this IPC message from a page this app actually loaded?
 *
 * Electron's security checklist asks every handler to validate the sender. The
 * check has to work for a custom scheme, where `URL.origin` is the opaque
 * `"null"`, so the comparison is on the parts that identify an app: scheme,
 * host and port.
 *
 * The allowlist is written the way a person reads it: `app://canvas` for the
 * bundled page, `http://localhost:5173` for the dev server.
 */
export function originKey(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "" || parsed.host === "")
            return null;
        // `host` already carries the port for http(s); a custom scheme has none.
        return `${parsed.protocol}//${parsed.host.toLowerCase()}`;
    }
    catch {
        return null;
    }
}
/**
 * True when the frame's URL belongs to one of the allowed origins.
 *
 * An absent frame URL is a refusal: a handler that cannot name the sender has
 * not validated it.
 */
export function isTrustedSender(frameUrl, allowed) {
    if (frameUrl === null || frameUrl === undefined)
        return false;
    const key = originKey(frameUrl);
    if (key === null)
        return false;
    return allowed.some((entry) => originKey(entry) === key);
}
//# sourceMappingURL=trust.js.map