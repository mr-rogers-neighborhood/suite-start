const ITEM = [
    "[role='menuitem']:not([disabled])",
    "[role='menuitemradio']:not([disabled])",
    "[role='menuitemcheckbox']:not([disabled])",
].join(", ");
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);
const MENUBAR_ITEM = [
    "[role='menuitem']:not([disabled])",
    "[role='menuitemradio']:not([disabled])",
    "[role='menuitemcheckbox']:not([disabled])",
    "button:not([disabled])",
    "a[href]",
].join(", ");
const MENUBAR_NAV_KEYS = new Set(["ArrowRight", "ArrowLeft", "Home", "End"]);
/**
 * Finds accessible menu items within a container, ensuring items in nested
 * submenus are excluded from the parent's item list.
 */
export function menuItemsIn(container, selector = ITEM, parentRole = "menu") {
    return [...container.querySelectorAll(selector)].filter((item) => item.closest(`[role='${parentRole}']`) === container);
}
/**
 * Arrow-key movement for a `role="menu"` container.
 *
 * Up and Down move between items, Home and End jump to the ends.
 * Items belong to the nearest menu, so a nested submenu lists only its own rows.
 */
export function menuKeyDown(event) {
    if (!NAV_KEYS.has(event.key))
        return;
    const menu = event.currentTarget;
    const items = menuItemsIn(menu, ITEM, "menu");
    if (items.length === 0)
        return;
    event.preventDefault();
    const focused = document.activeElement;
    const current = focused instanceof HTMLElement ? items.indexOf(focused) : -1;
    const target = event.key === "Home"
        ? 0
        : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowDown"
                ? (current + 1) % items.length
                : (current <= 0 ? items.length : current) - 1;
    items[target]?.focus();
}
/**
 * Move focus into the menu when it opens, and restore focus to the opener on dismiss.
 */
export function focusFirstMenuItem(menu) {
    if (menu === null)
        return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : null;
    const [first] = menuItemsIn(menu, ITEM, "menu");
    first?.focus();
    return () => {
        const current = document.activeElement;
        if (current !== null && current !== document.body && !menu.contains(current))
            return;
        if (opener?.isConnected === true)
            opener.focus();
    };
}
/**
 * Container-level keydown handler for horizontal WAI-ARIA `role="menubar"`.
 *
 * Moves focus horizontally with `ArrowRight` and `ArrowLeft` (cyclic), and jumps
 * to boundaries with `Home` and `End`.
 *
 * Bypasses navigation when focus is inside text inputs.
 * Excludes items inside nested submenus (role="menu") or nested dialogs.
 */
export function menuBarKeyDown(event) {
    if (!MENUBAR_NAV_KEYS.has(event.key))
        return;
    // Don't intercept arrow keys while typing in a text field
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
    }
    const bar = event.currentTarget;
    const items = [...bar.querySelectorAll(MENUBAR_ITEM)].filter((item) => {
        // If the item is inside a nested menu, menubar, or dialog that is not the bar itself,
        // it belongs to that nested container, not to the top-level bar.
        const nested = item.closest("[role='menu'], [role='menubar'], [role='dialog']");
        if (nested !== null && nested !== bar) {
            return false;
        }
        if (bar.getAttribute("role") === "menubar") {
            return item.closest("[role='menubar']") === bar;
        }
        return true;
    });
    if (items.length === 0)
        return;
    event.preventDefault();
    const focused = document.activeElement;
    const current = focused instanceof HTMLElement ? items.indexOf(focused) : -1;
    const target = event.key === "Home"
        ? 0
        : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowRight"
                ? (current + 1) % items.length
                : (current <= 0 ? items.length : current) - 1;
    items[target]?.focus();
}
/**
 * Programmatic keyboard controller for WAI-ARIA `role="menubar"` items.
 *
 * - `ArrowRight` / `ArrowLeft`: cyclic horizontal movement.
 * - `ArrowDown` / `Space` / `Enter`: opens active submenu.
 * - `Home` / `End`: jump to boundary items.
 * - `Escape`: dismiss open menu and restore focus to trigger.
 */
export function handleMenuBarKeyDown(event, items, activeIndex, onChangeFocus, onOpenSubmenu, onEscape) {
    if (items.length === 0)
        return;
    if (event.key === "ArrowRight") {
        event.preventDefault();
        const nextIndex = (activeIndex + 1) % items.length;
        onChangeFocus(nextIndex);
        items[nextIndex]?.focus();
    }
    else if (event.key === "ArrowLeft") {
        event.preventDefault();
        const nextIndex = (activeIndex <= 0 ? items.length : activeIndex) - 1;
        onChangeFocus(nextIndex);
        items[nextIndex]?.focus();
    }
    else if (event.key === "Home") {
        event.preventDefault();
        onChangeFocus(0);
        items[0]?.focus();
    }
    else if (event.key === "End") {
        event.preventDefault();
        const nextIndex = items.length - 1;
        onChangeFocus(nextIndex);
        items[nextIndex]?.focus();
    }
    else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        if (onOpenSubmenu) {
            event.preventDefault();
            onOpenSubmenu(activeIndex);
        }
    }
    else if (event.key === "Escape") {
        if (onEscape) {
            event.preventDefault();
            onEscape();
        }
    }
}
//# sourceMappingURL=menuKeys.js.map