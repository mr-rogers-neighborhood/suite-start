import type { KeyboardEvent as ReactKeyboardEvent } from "react";
/**
 * Finds accessible menu items within a container, ensuring items in nested
 * submenus are excluded from the parent's item list.
 */
export declare function menuItemsIn(container: HTMLElement, selector?: string, parentRole?: string): HTMLElement[];
/**
 * Arrow-key movement for a `role="menu"` container.
 *
 * Up and Down move between items, Home and End jump to the ends.
 * Items belong to the nearest menu, so a nested submenu lists only its own rows.
 */
export declare function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>): void;
/**
 * Move focus into the menu when it opens, and restore focus to the opener on dismiss.
 */
export declare function focusFirstMenuItem(menu: HTMLElement | null): (() => void) | undefined;
/**
 * Container-level keydown handler for horizontal WAI-ARIA `role="menubar"`.
 *
 * Moves focus horizontally with `ArrowRight` and `ArrowLeft` (cyclic), and jumps
 * to boundaries with `Home` and `End`.
 *
 * Bypasses navigation when focus is inside text inputs.
 * Excludes items inside nested submenus (role="menu") or nested dialogs.
 */
export declare function menuBarKeyDown(event: ReactKeyboardEvent<HTMLElement>): void;
/**
 * Programmatic keyboard controller for WAI-ARIA `role="menubar"` items.
 *
 * - `ArrowRight` / `ArrowLeft`: cyclic horizontal movement.
 * - `ArrowDown` / `Space` / `Enter`: opens active submenu.
 * - `Home` / `End`: jump to boundary items.
 * - `Escape`: dismiss open menu and restore focus to trigger.
 */
export declare function handleMenuBarKeyDown(event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent, items: readonly HTMLElement[] | HTMLElement[], activeIndex: number, onChangeFocus: (nextIndex: number) => void, onOpenSubmenu?: (index: number) => void, onEscape?: () => void): void;
//# sourceMappingURL=menuKeys.d.ts.map