/**
 * Serve a renderer from a custom protocol instead of `file://`.
 *
 * `file://` gives every page a privileged origin, has odd rules around relative
 * paths and modules, and is explicitly called out by Electron's security
 * checklist. A registered protocol with a host is a real, secure origin, so the
 * app keeps its routes and its storage, and the page can refuse to reach
 * anything else.
 *
 * The resolver reads the **raw** URL rather than `new URL(...).pathname`: a
 * WHATWG URL normalises `a/../b` to `b` before anyone can inspect it, so a climb
 * would otherwise be silently reinterpreted as a legitimate path.
 */
export interface ProtocolAssetOptions {
    /** The scheme to serve, without `://`. For example `app`. */
    readonly scheme: string;
    /**
     * Hosts this app answers. `app://canvas/...` is refused by an app that only
     * lists `planner`, so a link cannot borrow another app's origin.
     */
    readonly hosts: readonly string[];
    /** The file served when the path is empty. */
    readonly entry?: string;
}
export type ProtocolAsset = {
    readonly ok: true;
    readonly file: string;
} | {
    readonly ok: false;
};
export declare function resolveProtocolAsset(requestUrl: string, root: string, options: ProtocolAssetOptions): ProtocolAsset;
//# sourceMappingURL=protocol.d.ts.map