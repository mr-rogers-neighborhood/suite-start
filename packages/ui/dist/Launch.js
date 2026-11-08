import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "./cx.js";
import { INK } from "./tokens.js";
const FRAMES = {
    page: {
        outer: "mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-8 py-10",
        header: "flex items-start gap-4",
        title: "text-[34px] font-semibold tracking-tight",
        body: "",
    },
    card: {
        outer: "mx-auto w-[min(760px,100%)] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]",
        header: "flex items-end justify-between gap-6 border-b border-[var(--hairline)] px-8 pt-8 pb-7",
        title: "text-[34px] font-semibold tracking-tight",
        body: "px-8 py-6",
    },
    bar: {
        outer: "flex h-screen flex-col bg-[var(--canvas)]",
        header: "flex items-center gap-3 border-b border-[var(--hairline)] px-8 py-5",
        title: "text-[15px] font-semibold tracking-tight",
        body: "flex-1 overflow-y-auto px-8 py-8",
    },
};
export function Launch({ mark, title, tagline, hint, actions, recentEmpty, recents = [], onOpenRecent, children, footer, notice, frame = "page", className, }) {
    const headingId = useId();
    const chrome = FRAMES[frame];
    const compact = frame === "bar";
    return (_jsxs("div", { className: cx(chrome.outer, className), children: [notice, _jsxs("header", { className: chrome.header, children: [mark === undefined ? null : _jsx("div", { className: "shrink-0", children: mark }), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { id: headingId, className: chrome.title, children: title }), compact ? (_jsx("p", { className: cx("mt-0.5 text-[11px]", INK.muted), children: hint ?? tagline })) : (_jsxs("div", { className: cx("mt-1 max-w-[420px] text-[13px] leading-5", INK.muted), children: [_jsx("p", { children: tagline }), hint === undefined ? null : (_jsxs(_Fragment, { children: [_jsx("hr", { className: "my-2 border-[var(--hairline)]" }), _jsx("p", { children: hint })] }))] }))] }), compact && actions !== undefined ? (_jsx("div", { className: "ml-auto flex flex-wrap items-center gap-2", children: actions })) : null] }), _jsxs("div", { className: cx(chrome.body, "flex flex-col gap-6"), children: [compact || actions === undefined ? null : (_jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions })), children, _jsx("section", { "aria-labelledby": headingId, className: "flex flex-col gap-2", children: recents.length === 0
                            ? recentEmpty
                            : recents.map((recent) => (_jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-[var(--hairline)] px-3 py-2.5", children: [_jsxs("button", { type: "button", onClick: () => onOpenRecent?.(recent.id), className: "flex min-w-0 flex-1 flex-col items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]", children: [_jsx("span", { className: "truncate text-[13px] font-medium", children: recent.name }), recent.detail === undefined ? null : (_jsx("span", { className: cx("text-[11px]", INK.muted), children: recent.detail }))] }), recent.action] }, recent.id))) })] }), footer === undefined ? null : (_jsx("footer", { className: cx("mt-auto flex flex-wrap items-center gap-3 px-8 pb-6 text-[11px]", INK.faint), children: footer }))] }));
}
//# sourceMappingURL=Launch.js.map