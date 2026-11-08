import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, INK_ON, PRESSABLE, SURFACE } from "./tokens.js";
const VARIANTS = {
    // One background per variant, never two: two `bg-*` classes resolve by Tailwind's own
    // source order, not by the order they are written, so a pair would be a coin toss.
    primary: cx("bg-[var(--accent)]", INK_ON.accent, EDGE.none, "hover:bg-[var(--accent-strong)]"),
    secondary: cx(SURFACE.base, INK.base, EDGE.strong, "hover:bg-[var(--surface-sunk)]"),
    ghost: cx("bg-transparent", INK.muted, EDGE.none, "hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"),
    danger: cx("bg-[var(--danger)]", INK_ON.danger, EDGE.none, "hover:brightness-95"),
};
const SIZES = {
    sm: "h-8 gap-1.5 rounded-md px-2.5 text-[12px]",
    md: "h-9 gap-2 rounded-lg px-3 text-[13px]",
};
export function Button({ variant = "secondary", size = "md", icon, className, type = "button", children, ...props }) {
    return (_jsxs("button", { type: type, className: cx(PRESSABLE, "shrink-0 whitespace-nowrap border", FOCUS_RING, VARIANTS[variant], SIZES[size], className), ...props, children: [icon === undefined ? null : _jsx("span", { "aria-hidden": "true", children: icon }), children] }));
}
//# sourceMappingURL=Button.js.map