/**
 * The page policy every Suite app ships.
 *
 * A desktop renderer that cannot reach the network is a renderer that cannot
 * leak a document, so the default is `connect-src 'self'` and everything else
 * closed. An app widens exactly one directive when it has a reason: the dev
 * server while developing, or the sync server's origin once sync is configured.
 *
 * `wasm-unsafe-eval` is not optional: Loro's CRDT core is WebAssembly, and a
 * sandboxed renderer without it cannot open a document at all. `style-src`
 * keeps `unsafe-inline` because the theme, radius and density are restored
 * before first paint; `script-src` does not.
 */
export interface DesktopCspOptions {
    /**
     * Allow `'wasm-unsafe-eval'` for a renderer that runs WebAssembly (Loro's CRDT
     * core). A page that never compiles wasm should turn it off.
     */
    readonly wasm?: boolean;
    readonly connectSrc?: readonly string[];
    readonly imgSrc?: readonly string[];
    readonly mediaSrc?: readonly string[];
    readonly fontSrc?: readonly string[];
    readonly scriptSrc?: readonly string[];
    readonly styleSrc?: readonly string[];
    readonly workerSrc?: readonly string[];
}
export declare function desktopCsp(options?: DesktopCspOptions): string;
/** The `script-src` directive on its own, for a caller that checks the policy. */
export declare function scriptSrcDirective(policy?: string): string;
//# sourceMappingURL=csp.d.ts.map