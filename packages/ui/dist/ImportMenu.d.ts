/** One thing an app can import, and what to do when it is chosen. */
export interface ImportOption {
    /** How the entry reads in the menu: "Obsidian vault", "Suite canvas". */
    readonly label: string;
    /** One line under the label, for the case where the label alone is ambiguous. */
    readonly detail?: string;
    readonly onSelect: () => void;
}
export interface ImportMenuProps {
    readonly options: readonly ImportOption[];
    /**
     * The trigger's label. "Import" by default; an app may say what it imports.
     *
     * The ellipsis is added here rather than by the caller, because a label that opens a menu
     * needs one and a caller who forgets is invisible until someone reads the screen.
     */
    readonly label?: string;
    readonly disabled?: boolean;
    readonly className?: string;
}
/**
 * A trigger that offers several ways to bring material in.
 *
 * Deliberately a **disclosure**, not `role="menu"`. A menu role promises arrow-key travel
 * between items, Home/End, and typeahead; a disclosure promises that Tab reaches each item and
 * Escape closes it. The second promise is the one this control keeps, and a control that claims
 * the first without keeping it is worse for a screen reader than one that claims less.
 *
 * With a single option there is no menu: a menu holding one item is a click that buys nothing,
 * so the trigger becomes the action.
 */
export declare function ImportMenu({ options, label, disabled, className, }: ImportMenuProps): import("react").JSX.Element | null;
//# sourceMappingURL=ImportMenu.d.ts.map