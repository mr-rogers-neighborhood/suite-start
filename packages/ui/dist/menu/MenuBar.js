import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useState } from "react";
import { cx } from "../cx.js";
import { FOCUS_RING } from "../tokens.js";
import { menuBarKeyDown } from "./menuKeys.js";
/**
 * Generalized cross-app top application bar ("Menu Bar").
 *
 * Implements the 7 semantic zones:
 * 1. `mark`: Host branding / navigation anchor with optional `onNavigateHome`.
 * 2. `context`: Title, subtitle, inline renaming, and document dropdown menu.
 * 3. `navigation`: Active mini-app takeover slot (tabs, board switcher, date nav).
 * 4. `search`: Universal search trigger (`⌘K`).
 * 5. `peers` & `sync`: Peer presence cluster and `<SyncPill />`.
 * 6. `actions`: Domain contextual action buttons.
 * 7. `controls`: Host controls (theme toggle, window controls, mobile capsule).
 */
export const MenuBar = forwardRef(function MenuBar({ mark, homeHref = "/", onNavigateHome, homeAriaLabel = "Back to workspace launcher", context, title, subtitle, canRename = false, onRename, isRenaming: controlledRenaming, onRenamingChange, titleTestId = "menubar-title", titleInputTestId = "menubar-title-input", navigation, search, onOpenSearch, searchPlaceholder = "Search or jump to\u2026", searchShortcut = "\u2318K", peers, sync, actions, controls, children, className, role, "aria-label": ariaLabel, onKeyDown, ...props }, ref) {
    const [internalRenaming, setInternalRenaming] = useState(false);
    const isEditing = controlledRenaming ?? internalRenaming;
    const [draft, setDraft] = useState(title ?? "");
    const [renameError, setRenameError] = useState(null);
    useEffect(() => {
        setDraft(title ?? "");
    }, [title]);
    function setEditingState(next) {
        if (controlledRenaming === undefined) {
            setInternalRenaming(next);
        }
        onRenamingChange?.(next);
    }
    function commitRename() {
        if (!isEditing)
            return;
        const trimmed = draft.trim();
        if (trimmed === title || !trimmed) {
            setDraft(title ?? "");
            setRenameError(null);
            setEditingState(false);
            return;
        }
        const problem = onRename?.(trimmed);
        if (typeof problem === "string" && problem.length > 0) {
            setRenameError(problem);
            return;
        }
        setRenameError(null);
        setEditingState(false);
    }
    function cancelRename() {
        setDraft(title ?? "");
        setRenameError(null);
        setEditingState(false);
    }
    function handleHomeClick(event) {
        if (!onNavigateHome)
            return;
        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey) {
            return;
        }
        event.preventDefault();
        onNavigateHome();
    }
    const takeover = navigation ?? children;
    const hasRightCluster = Boolean(peers || sync || actions || controls);
    return (
    // biome-ignore lint/a11y/noStaticElementInteractions: MenuBar implements WAI-ARIA role="menubar" keyboard navigation
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: Menubar role supports aria-label
    _jsxs("header", { ref: ref, role: role, "aria-label": ariaLabel, "data-handbook-region": props["data-handbook-region"] ?? "title-bar", onKeyDown: onKeyDown ?? menuBarKeyDown, className: cx("app-bar relative z-20 flex h-11 shrink-0 items-center gap-3 bg-[var(--surface-translucent,var(--surface))] px-4 text-[length:var(--text-body,13px)] text-[var(--ink)] shadow-[inset_0_-1px_0_var(--hairline)] backdrop-blur-md", className), ...props, children: [mark ? (onNavigateHome || homeHref ? (_jsx("a", { href: homeHref, "aria-label": homeAriaLabel, className: "flex shrink-0 items-center transition-opacity hover:opacity-70", onClick: handleHomeClick, children: mark })) : (_jsx("div", { className: "flex shrink-0 items-center", children: mark }))) : null, context ? (context) : title !== undefined ? (_jsxs("div", { className: "flex shrink-0 items-center gap-1.5", children: [isEditing ? (_jsx("input", { 
                        // biome-ignore lint/a11y/noAutofocus: explicit user rename gesture
                        autoFocus: true, value: draft, "aria-label": "Title", "data-testid": titleInputTestId, className: cx("h-7 rounded border border-[var(--focus)] bg-[var(--surface)] px-2 text-[length:var(--text-body,13px)] font-medium text-[var(--ink)] outline-none", FOCUS_RING), onChange: (e) => {
                            setDraft(e.target.value);
                            setRenameError(null);
                        }, onBlur: commitRename, onKeyDown: (e) => {
                            if (e.key === "Enter") {
                                e.currentTarget.blur();
                            }
                            else if (e.key === "Escape") {
                                cancelRename();
                            }
                        } })) : (_jsxs("button", { type: "button", "data-testid": titleTestId, className: cx("inline-flex max-w-[200px] select-none items-center gap-1.5 truncate rounded px-1.5 py-1 font-medium transition-colors hover:bg-[var(--surface-sunk)]", FOCUS_RING), onDoubleClick: () => {
                            if (canRename) {
                                setDraft(title ?? "");
                                setRenameError(null);
                                setEditingState(true);
                            }
                        }, children: [_jsx("span", { className: "min-w-0 truncate", children: title }), subtitle ? (_jsx("span", { className: "shrink-0 text-[11px] text-[var(--ink-muted)]", children: subtitle })) : null] })), renameError ? (_jsx("span", { role: "alert", className: "text-[11px] text-[var(--danger)]", children: renameError })) : null] })) : null, takeover ? _jsx("div", { className: "flex min-w-0 flex-initial items-center", children: takeover }) : null, search ? (search) : onOpenSearch ? (_jsxs("button", { type: "button", "data-testid": "command-bar", "data-handbook-region": "command-bar", "aria-label": "Search or run a command", "aria-keyshortcuts": "Meta+K Control+K", title: "Search or run a command (\u2318K)", onClick: onOpenSearch, className: cx("command-bar flex h-7 min-w-[88px] flex-1 max-w-sm items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-sunk)] px-2 text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]", FOCUS_RING), children: [_jsx("span", { "aria-hidden": "true", className: "command-bar__glyph opacity-70", children: "\u2315" }), _jsx("span", { className: "command-bar__label min-w-0 flex-1 truncate text-left", children: searchPlaceholder }), _jsx("kbd", { className: "command-bar__key rounded border border-[var(--hairline)] px-1 py-0.5 text-[10px] opacity-70", children: searchShortcut })] })) : null, hasRightCluster ? (_jsxs("div", { className: "ml-auto flex shrink-0 items-center gap-3", children: [peers, sync, actions, controls] })) : null] }));
});
//# sourceMappingURL=MenuBar.js.map