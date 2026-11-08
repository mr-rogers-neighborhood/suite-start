import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, SURFACE } from "./tokens.js";
export function Field({ label, hint, error, trailing, id, className, ...props }) {
    const generated = useId();
    const fieldId = id ?? generated;
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;
    const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
        .filter((value) => value !== null)
        .join(" ");
    return (_jsxs("div", { className: cx("flex flex-col gap-1.5", className), children: [_jsx("label", { htmlFor: fieldId, className: cx("text-[12px] font-medium", INK.base), children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { id: fieldId, "aria-invalid": error !== undefined, "aria-describedby": describedBy.length === 0 ? undefined : describedBy, className: cx("h-9 w-full rounded-lg border px-3 text-[13px] transition-colors", SURFACE.base, INK.base, FOCUS_RING, 
                        // An input's edge is the only thing saying "you can type here", so it is a
                        // component boundary and clears 3:1 — `hairline` would not.
                        error === undefined ? EDGE.strong : EDGE.danger, "placeholder:text-[var(--ink-faint)]", "disabled:opacity-50"), ...props }), trailing] }), hint === undefined ? null : (_jsx("p", { id: hintId, className: cx("text-[11px]", INK.muted), children: hint })), error === undefined ? null : (_jsx("p", { id: errorId, className: cx("text-[11px]", INK.danger), children: error }))] }));
}
//# sourceMappingURL=Field.js.map