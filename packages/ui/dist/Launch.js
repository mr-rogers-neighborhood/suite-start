import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "./cx.js";
import { ImportMenu } from "./ImportMenu.js";
import { INK } from "./tokens.js";
/**
 * The frame, of which there is one.
 *
 * There were three, because Canvas, Budget and Planner had each drawn their own launcher and a
 * `frame` prop kept them from diverging further. That was the wrong shape for the goal: three
 * apps a person moves between should not ask them to re-learn the front door, and a prop that
 * exists so three screens can differ guarantees they will. The centred card won because it reads
 * as a place to start rather than as a toolbar above a list.
 */
const FRAME = {
    outer: "mx-auto w-[min(760px,100%)] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]",
    header: "flex items-end justify-between gap-6 border-b border-[var(--hairline)] px-8 pt-8 pb-7",
    title: "text-[34px] font-semibold tracking-tight",
    body: "px-8 py-6",
};
export function Launch({ mark, title, tagline, hint, actions, importOptions, recentEmpty, recents = [], onOpenRecent, children, footer, notice, className, }) {
    const headingId = useId();
    const chrome = FRAME;
    return (_jsxs("div", { className: cx(chrome.outer, className), children: [notice, _jsxs("header", { className: chrome.header, children: [mark === undefined ? null : _jsx("div", { className: "shrink-0", children: mark }), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { id: headingId, className: chrome.title, children: title }), _jsxs("div", { className: cx("mt-1 max-w-[420px] text-[13px] leading-5", INK.muted), children: [_jsx("p", { children: tagline }), hint === undefined ? null : (_jsxs(_Fragment, { children: [_jsx("hr", { className: "my-2 border-[var(--hairline)]" }), _jsx("p", { children: hint })] }))] })] })] }), _jsxs("div", { className: cx(chrome.body, "flex flex-col gap-6"), children: [actions === undefined && importOptions === undefined ? null : (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [actions, importOptions === undefined ? null : _jsx(ImportMenu, { options: importOptions })] })), children, _jsx("section", { "aria-labelledby": headingId, className: "flex flex-col gap-2", children: recents.length === 0
                            ? recentEmpty
                            : recents.map((recent) => (_jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-[var(--hairline)] px-3 py-2.5", children: [_jsxs("button", { type: "button", onClick: () => onOpenRecent?.(recent.id), className: "flex min-w-0 flex-1 flex-col items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]", children: [_jsx("span", { className: "truncate text-[13px] font-medium", children: recent.name }), recent.detail === undefined ? null : (_jsx("span", { className: cx("text-[11px]", INK.muted), children: recent.detail }))] }), recent.action] }, recent.id))) })] }), footer === undefined ? null : (_jsx("footer", { className: cx("mt-auto flex flex-wrap items-center gap-3 px-8 pb-6 text-[11px]", INK.faint), children: footer }))] }));
}
//# sourceMappingURL=Launch.js.map