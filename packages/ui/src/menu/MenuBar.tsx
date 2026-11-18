import { type ComponentProps, forwardRef, type ReactNode, useEffect, useState } from "react";
import { cx } from "../cx.js";
import { FOCUS_RING } from "../tokens.js";
import { menuBarKeyDown } from "./menuKeys.js";

export interface MenuBarProps extends Omit<ComponentProps<"header">, "title"> {
  /** Zone 1: Host branding / navigation anchor */
  readonly mark?: ReactNode | undefined;
  /** Back to launcher or home destination URL */
  readonly homeHref?: string | undefined;
  /** Intercepts brand link click for shell transitions/animations */
  readonly onNavigateHome?: (() => void) | undefined;
  /** Accessible label for the home link (defaults to "Back to workspace launcher") */
  readonly homeAriaLabel?: string | undefined;

  /** Zone 2: Title, subtitle, inline renaming, and document dropdown menu */
  readonly context?: ReactNode | undefined;
  readonly title?: string | undefined;
  readonly subtitle?: ReactNode | undefined;
  readonly canRename?: boolean | undefined;
  readonly onRename?: ((name: string) => string | null | undefined) | undefined;
  readonly isRenaming?: boolean | undefined;
  readonly onRenamingChange?: ((renaming: boolean) => void) | undefined;
  readonly titleTestId?: string | undefined;
  readonly titleInputTestId?: string | undefined;

  /** Zone 3: Active mini-app takeover slot (tabs, board switcher, date navigation) */
  readonly navigation?: ReactNode | undefined;

  /** Zone 4: Universal search trigger (⌘K) or custom search input */
  readonly search?: ReactNode | undefined;
  readonly onOpenSearch?: (() => void) | undefined;
  readonly searchPlaceholder?: string | undefined;
  readonly searchShortcut?: string | undefined;

  /** Zone 5: Peer presence cluster and sync status pill */
  readonly peers?: ReactNode | undefined;
  readonly sync?: ReactNode | undefined;

  /** Zone 6: Domain contextual action buttons */
  readonly actions?: ReactNode | undefined;

  /** Zone 7: Host controls (theme toggle, window controls, mobile capsule) */
  readonly controls?: ReactNode | undefined;

  /** Fallback slot for takeover content / children */
  readonly children?: ReactNode | undefined;

  readonly "data-testid"?: string | undefined;
  readonly "data-handbook-region"?: string | undefined;
}

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
export const MenuBar = forwardRef<HTMLElement, MenuBarProps>(function MenuBar(
  {
    mark,
    homeHref = "/",
    onNavigateHome,
    homeAriaLabel = "Back to workspace launcher",
    context,
    title,
    subtitle,
    canRename = false,
    onRename,
    isRenaming: controlledRenaming,
    onRenamingChange,
    titleTestId = "menubar-title",
    titleInputTestId = "menubar-title-input",
    navigation,
    search,
    onOpenSearch,
    searchPlaceholder = "Search or jump to\u2026",
    searchShortcut = "\u2318K",
    peers,
    sync,
    actions,
    controls,
    children,
    className,
    role,
    "aria-label": ariaLabel,
    onKeyDown,
    ...props
  },
  ref,
) {
  const [internalRenaming, setInternalRenaming] = useState(false);
  const isEditing = controlledRenaming ?? internalRenaming;

  const [draft, setDraft] = useState(title ?? "");
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(title ?? "");
  }, [title]);

  function setEditingState(next: boolean) {
    if (controlledRenaming === undefined) {
      setInternalRenaming(next);
    }
    onRenamingChange?.(next);
  }

  function commitRename() {
    if (!isEditing) return;
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

  function handleHomeClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!onNavigateHome) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
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
    <header
      ref={ref}
      role={role}
      aria-label={ariaLabel}
      data-handbook-region={props["data-handbook-region"] ?? "title-bar"}
      onKeyDown={onKeyDown ?? menuBarKeyDown}
      className={cx(
        "app-bar relative z-20 flex h-11 shrink-0 items-center gap-3 bg-[var(--surface-translucent,var(--surface))] px-4 text-[length:var(--text-body,13px)] text-[var(--ink)] shadow-[inset_0_-1px_0_var(--hairline)] backdrop-blur-md",
        className,
      )}
      {...props}
    >
      {/* Zone 1: Mark */}
      {mark ? (
        onNavigateHome || homeHref ? (
          <a
            href={homeHref}
            aria-label={homeAriaLabel}
            className="flex shrink-0 items-center transition-opacity hover:opacity-70"
            onClick={handleHomeClick}
          >
            {mark}
          </a>
        ) : (
          <div className="flex shrink-0 items-center">{mark}</div>
        )
      ) : null}

      {/* Zone 2: Context */}
      {context ? (
        context
      ) : title !== undefined ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {isEditing ? (
            <input
              // biome-ignore lint/a11y/noAutofocus: explicit user rename gesture
              autoFocus
              value={draft}
              aria-label="Title"
              data-testid={titleInputTestId}
              className={cx(
                "h-7 rounded border border-[var(--focus)] bg-[var(--surface)] px-2 text-[length:var(--text-body,13px)] font-medium text-[var(--ink)] outline-none",
                FOCUS_RING,
              )}
              onChange={(e) => {
                setDraft(e.target.value);
                setRenameError(null);
              }}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  cancelRename();
                }
              }}
            />
          ) : (
            <button
              type="button"
              data-testid={titleTestId}
              className={cx(
                "inline-flex max-w-[200px] select-none items-center gap-1.5 truncate rounded px-1.5 py-1 font-medium transition-colors hover:bg-[var(--surface-sunk)]",
                FOCUS_RING,
              )}
              onDoubleClick={() => {
                if (canRename) {
                  setDraft(title ?? "");
                  setRenameError(null);
                  setEditingState(true);
                }
              }}
            >
              <span className="min-w-0 truncate">{title}</span>
              {subtitle ? (
                <span className="shrink-0 text-[11px] text-[var(--ink-muted)]">{subtitle}</span>
              ) : null}
            </button>
          )}
          {renameError ? (
            <span role="alert" className="text-[11px] text-[var(--danger)]">
              {renameError}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Zone 3: Navigation (Mini-App Takeover Slot) */}
      {takeover ? <div className="flex min-w-0 flex-initial items-center">{takeover}</div> : null}

      {/* Zone 4: Search */}
      {search ? (
        search
      ) : onOpenSearch ? (
        <button
          type="button"
          data-testid="command-bar"
          data-handbook-region="command-bar"
          aria-label="Search or run a command"
          aria-keyshortcuts="Meta+K Control+K"
          title="Search or run a command (⌘K)"
          onClick={onOpenSearch}
          className={cx(
            "command-bar flex h-7 min-w-[88px] flex-1 max-w-sm items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-sunk)] px-2 text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]",
            FOCUS_RING,
          )}
        >
          <span aria-hidden="true" className="command-bar__glyph opacity-70">
            {"\u2315"}
          </span>
          <span className="command-bar__label min-w-0 flex-1 truncate text-left">
            {searchPlaceholder}
          </span>
          <kbd className="command-bar__key rounded border border-[var(--hairline)] px-1 py-0.5 text-[10px] opacity-70">
            {searchShortcut}
          </kbd>
        </button>
      ) : null}

      {/* Zones 5, 6, 7: Peers, Sync, Actions, Controls */}
      {hasRightCluster ? (
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {peers}
          {sync}
          {actions}
          {controls}
        </div>
      ) : null}
    </header>
  );
});
