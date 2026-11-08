import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "./cx.js";
import { INK } from "./tokens.js";
export function EmptyState({ title, children, action, className }) {
    return (_jsxs("div", { className: cx("rounded-xl border border-dashed border-[var(--hairline)] px-6 py-8 text-center", className), children: [_jsx("p", { className: cx("text-[length:var(--text-body,13px)] font-medium", INK.base), children: title }), children === undefined ? null : (_jsx("p", { className: cx("mx-auto mt-1 max-w-[46ch] text-[length:var(--text-label,12px)]", INK.muted), children: children })), action === undefined ? null : _jsx("div", { className: "mt-4 flex justify-center gap-2", children: action })] }));
}
//# sourceMappingURL=EmptyState.js.map