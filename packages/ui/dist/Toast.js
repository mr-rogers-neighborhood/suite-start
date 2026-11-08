import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { cx } from "./cx.js";
import { EDGE, INK, SURFACE } from "./tokens.js";
const DEFAULT_DURATION = 4500;
export function Toast({ notice, onDismiss, duration = DEFAULT_DURATION, className }) {
    useEffect(() => {
        if (notice === null || duration <= 0)
            return;
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [notice, duration, onDismiss]);
    if (notice === null)
        return null;
    const failed = notice.tone === "error";
    return (_jsxs("div", { role: failed ? "alert" : "status", className: cx("fixed bottom-5 right-5 z-[80] flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-[length:var(--text-body,13px)] shadow-2xl", SURFACE.base, failed ? cx(EDGE.danger, INK.danger) : cx(EDGE.hairline, INK.base), className), children: [_jsx("p", { className: "leading-relaxed", children: notice.message }), _jsx("button", { type: "button", onClick: onDismiss, "aria-label": "Dismiss", className: cx("shrink-0 text-[length:var(--text-caption,11px)] transition-colors hover:text-[var(--ink)]", INK.muted, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"), children: "\u00D7" })] }));
}
//# sourceMappingURL=Toast.js.map