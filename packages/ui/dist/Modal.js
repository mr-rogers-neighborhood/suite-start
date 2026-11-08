import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx.js";
import { EDGE, INK, SURFACE } from "./tokens.js";
const SIZES = {
    sm: "w-[min(400px,calc(100vw-2rem))]",
    md: "w-[min(560px,calc(100vw-2rem))]",
    lg: "w-[min(760px,calc(100vw-2rem))]",
};
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function Modal({ open, onClose, label, children, size = "md", className }) {
    const panel = useRef(null);
    const restoreTo = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        restoreTo.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const first = panel.current?.querySelector(FOCUSABLE) ?? panel.current;
        first?.focus();
        return () => restoreTo.current?.focus();
    }, [open]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== "Tab" || panel.current === null)
                return;
            // Wrap inside the panel: without this, Tab walks out into the page behind the dialog,
            // which is still visible but not reachable by anything else.
            const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
            const first = items[0];
            const last = items.at(-1);
            if (first === undefined || last === undefined)
                return;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[70] flex items-center justify-center", children: [_jsx("button", { type: "button", "aria-label": `Close ${label}`, className: "absolute inset-0 cursor-default border-0 bg-black/30 backdrop-blur-[2px]", onClick: onClose }), _jsx("div", { ref: panel, role: "dialog", "aria-modal": "true", "aria-label": label, tabIndex: -1, className: cx("relative max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border p-5 shadow-2xl", SURFACE.base, EDGE.hairline, INK.base, SIZES[size], className), children: children })] }), document.body);
}
//# sourceMappingURL=Modal.js.map