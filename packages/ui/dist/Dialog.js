import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "./cx.js";
import { Modal } from "./Modal.js";
import { INK } from "./tokens.js";
export function Dialog({ open, onClose, title, description, children, actions, size = "md", }) {
    return (_jsxs(Modal, { open: open, onClose: onClose, label: title, size: size, children: [_jsx("h2", { className: "text-[15px] font-semibold tracking-tight", children: title }), description === undefined ? null : (_jsx("p", { className: cx("mt-1 text-[12px] leading-5", INK.muted), children: description })), children === undefined ? null : _jsx("div", { className: "mt-4", children: children }), actions === undefined ? null : (_jsx("div", { className: "mt-5 flex flex-wrap items-center justify-end gap-2", children: actions }))] }));
}
//# sourceMappingURL=Dialog.js.map