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

const DEFAULTS = {
  scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "blob:"],
  mediaSrc: ["'self'", "blob:"],
  fontSrc: ["'self'", "data:"],
  connectSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
} as const;

function directive(name: string, values: readonly string[]): string {
  return `${name} ${[...new Set(values)].join(" ")}`;
}

export function desktopCsp(options: DesktopCspOptions = {}): string {
  const script =
    options.wasm === false
      ? DEFAULTS.scriptSrc.filter((value) => value !== "'wasm-unsafe-eval'")
      : DEFAULTS.scriptSrc;
  return [
    "default-src 'none'",
    directive("script-src", [...script, ...(options.scriptSrc ?? [])]),
    directive("style-src", [...DEFAULTS.styleSrc, ...(options.styleSrc ?? [])]),
    directive("img-src", [...DEFAULTS.imgSrc, ...(options.imgSrc ?? [])]),
    directive("media-src", [...DEFAULTS.mediaSrc, ...(options.mediaSrc ?? [])]),
    directive("font-src", [...DEFAULTS.fontSrc, ...(options.fontSrc ?? [])]),
    directive("connect-src", [...DEFAULTS.connectSrc, ...(options.connectSrc ?? [])]),
    directive("worker-src", [...DEFAULTS.workerSrc, ...(options.workerSrc ?? [])]),
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** The `script-src` directive on its own, for a caller that checks the policy. */
export function scriptSrcDirective(policy: string = desktopCsp()): string {
  return (
    policy
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src")) ?? ""
  );
}
