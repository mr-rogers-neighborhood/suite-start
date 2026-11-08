import { jsx as _jsx } from "react/jsx-runtime";
import { cx } from "./cx.js";
const SIZES = {
    sm: { tile: "h-6 w-6 rounded-[8px]", inset: "h-4 w-4" },
    md: { tile: "h-7 w-7 rounded-[9px]", inset: "h-[18px] w-[18px]" },
    lg: { tile: "h-12 w-12 rounded-2xl", inset: "h-7 w-7" },
};
export function AppMark({ viewBox, paths, label, size = "md", className, }) {
    const { tile, inset } = SIZES[size];
    const named = label !== undefined;
    return (_jsx("span", { className: cx("inline-flex shrink-0 items-center justify-center", tile, 
        // The tile is the paint; the glyph inherits what the theme says is readable on it.
        "bg-[var(--accent)] text-[var(--on-accent)]", className), ...(named ? { role: "img", "aria-label": label } : { "aria-hidden": true }), children: _jsx("svg", { viewBox: viewBox, className: inset, fill: "currentColor", focusable: "false", "aria-hidden": "true", children: paths.map((d) => (_jsx("path", { d: d }, d))) }) }));
}
//# sourceMappingURL=AppMark.js.map