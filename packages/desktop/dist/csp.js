const DEFAULTS = {
    scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:"],
    mediaSrc: ["'self'", "blob:"],
    fontSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    workerSrc: ["'self'", "blob:"],
};
function directive(name, values) {
    return `${name} ${[...new Set(values)].join(" ")}`;
}
export function desktopCsp(options = {}) {
    const script = options.wasm === false
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
export function scriptSrcDirective(policy = desktopCsp()) {
    return (policy
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("script-src")) ?? "");
}
//# sourceMappingURL=csp.js.map