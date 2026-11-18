import { type ComponentProps, type ReactNode } from "react";
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
export declare const MenuBar: import("react").ForwardRefExoticComponent<Omit<MenuBarProps, "ref"> & import("react").RefAttributes<HTMLElement>>;
//# sourceMappingURL=MenuBar.d.ts.map