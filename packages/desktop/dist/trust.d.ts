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
export declare function originKey(url: string): string | null;
/**
 * True when the frame's URL belongs to one of the allowed origins.
 *
 * An absent frame URL is a refusal: a handler that cannot name the sender has
 * not validated it.
 */
export declare function isTrustedSender(frameUrl: string | null | undefined, allowed: readonly string[]): boolean;
//# sourceMappingURL=trust.d.ts.map