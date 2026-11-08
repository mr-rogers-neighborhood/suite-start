import { jsx as _jsx } from "react/jsx-runtime";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, PRESSABLE, SURFACE } from "./tokens.js";
const SIZES = {
    sm: "h-7 w-7 rounded-md",
    md: "h-9 w-9 rounded-lg",
};
export function IconButton({ label, size = "sm", variant = "quiet", className, type = "button", children, ...props }) {
    return (_jsx("button", { type: type, "aria-label": label, title: props.title ?? label, className: cx(PRESSABLE, "shrink-0 border", FOCUS_RING, SIZES[size], variant === "plain"
            ? cx(SURFACE.base, EDGE.strong, INK.base, "hover:bg-[var(--surface-sunk)]")
            : cx("bg-transparent", EDGE.none, INK.muted, "hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"), className), ...props, children: _jsx("span", { "aria-hidden": "true", children: children }) }));
}
//# sourceMappingURL=IconButton.js.map