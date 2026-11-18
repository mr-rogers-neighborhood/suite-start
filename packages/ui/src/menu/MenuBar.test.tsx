import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuBar } from "./MenuBar.js";
import { handleMenuBarKeyDown, menuBarKeyDown } from "./menuKeys.js";
import { SyncPill } from "./SyncPill.js";

describe("MenuBar slot rendering", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders mark in zone 1 with home navigation link", () => {
    const onNavigateHome = vi.fn();
    render(
      <MenuBar
        mark={<span data-testid="test-mark">AppLogo</span>}
        onNavigateHome={onNavigateHome}
      />,
    );

    const link = screen.getByRole("link", { name: "Back to workspace launcher" });
    expect(link).toBeInTheDocument();
    expect(screen.getByTestId("test-mark")).toBeInTheDocument();

    fireEvent.click(link);
    expect(onNavigateHome).toHaveBeenCalledTimes(1);
  });

  it("leaves modified clicks on mark link to the browser", () => {
    const onNavigateHome = vi.fn();
    render(
      <MenuBar
        mark={<span data-testid="test-mark">AppLogo</span>}
        onNavigateHome={onNavigateHome}
      />,
    );

    const link = screen.getByRole("link", { name: "Back to workspace launcher" });
    fireEvent.click(link, { metaKey: true });
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it("renders custom context slot in zone 2", () => {
    render(<MenuBar context={<div data-testid="custom-context">My Custom Context</div>} />);
    expect(screen.getByTestId("custom-context")).toHaveTextContent("My Custom Context");
  });

  it("renders built-in title and subtitle in zone 2 when provided", () => {
    render(<MenuBar title="Workspace Alpha" subtitle="Draft" />);
    expect(screen.getByTestId("menubar-title")).toHaveTextContent("Workspace Alpha");
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders active mini-app takeover in zone 3 via navigation prop or children", () => {
    render(
      <MenuBar navigation={<nav data-testid="tabs-nav">Takeover Tabs</nav>}>
        <div data-testid="fallback-children">Children</div>
      </MenuBar>,
    );
    expect(screen.getByTestId("tabs-nav")).toBeInTheDocument();
    // navigation takes precedence over children
    expect(screen.queryByTestId("fallback-children")).toBeNull();
  });

  it("renders fallback children in zone 3 when navigation is omitted", () => {
    render(
      <MenuBar>
        <div data-testid="fallback-children">Board Switcher</div>
      </MenuBar>,
    );
    expect(screen.getByTestId("fallback-children")).toBeInTheDocument();
  });

  it("renders custom search node in zone 4", () => {
    render(<MenuBar search={<input data-testid="custom-search" placeholder="Quick find..." />} />);
    expect(screen.getByTestId("custom-search")).toBeInTheDocument();
  });

  it("renders command bar trigger in zone 4 when onOpenSearch is provided", () => {
    const onOpenSearch = vi.fn();
    render(<MenuBar onOpenSearch={onOpenSearch} />);

    const searchBtn = screen.getByTestId("command-bar");
    expect(searchBtn).toBeInTheDocument();
    expect(searchBtn).toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");

    fireEvent.click(searchBtn);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it("renders peers, sync, actions, and controls in zones 5, 6, and 7", () => {
    render(
      <MenuBar
        peers={<div data-testid="peers-cluster">3 peers</div>}
        sync={<SyncPill situation="synced" label="Saved" />}
        actions={
          <button type="button" data-testid="action-export">
            Export
          </button>
        }
        controls={
          <button type="button" data-testid="theme-toggle">
            Theme
          </button>
        }
      />,
    );

    expect(screen.getByTestId("peers-cluster")).toHaveTextContent("3 peers");
    expect(screen.getByTestId("sync-status")).toHaveTextContent("Saved");
    expect(screen.getByTestId("action-export")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });
});

describe("MenuBar inline renaming", () => {
  afterEach(() => {
    cleanup();
  });

  it("enters rename mode on double-click when canRename is true", () => {
    render(<MenuBar title="Initial Title" canRename={true} />);

    const titleBtn = screen.getByTestId("menubar-title");
    fireEvent.doubleClick(titleBtn);

    const input = screen.getByTestId("menubar-title-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Initial Title");
  });

  it("does not enter rename mode on double-click when canRename is false", () => {
    render(<MenuBar title="Locked Title" canRename={false} />);

    fireEvent.doubleClick(screen.getByTestId("menubar-title"));
    expect(screen.queryByTestId("menubar-title-input")).toBeNull();
  });

  it("commits renamed title on Enter", () => {
    const onRename = vi.fn();
    render(<MenuBar title="Current Title" canRename={true} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId("menubar-title"));
    const input = screen.getByTestId("menubar-title-input");

    fireEvent.change(input, { target: { value: "New Canvas Name" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRename).toHaveBeenCalledWith("New Canvas Name");
    expect(screen.queryByTestId("menubar-title-input")).toBeNull();
  });

  it("cancels rename and reverts title on Escape", () => {
    const onRename = vi.fn();
    render(<MenuBar title="Original Title" canRename={true} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId("menubar-title"));
    const input = screen.getByTestId("menubar-title-input");

    fireEvent.change(input, { target: { value: "Abandoned Edit" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByTestId("menubar-title-input")).toBeNull();
    expect(screen.getByTestId("menubar-title")).toHaveTextContent("Original Title");
  });

  it("commits on blur", () => {
    const onRename = vi.fn();
    render(<MenuBar title="Title Before Blur" canRename={true} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId("menubar-title"));
    const input = screen.getByTestId("menubar-title-input");

    fireEvent.change(input, { target: { value: "Title After Blur" } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith("Title After Blur");
  });

  it("displays validation error when onRename returns an error string", () => {
    const onRename = vi.fn().mockReturnValue("Name already taken");
    render(<MenuBar title="Duplicate" canRename={true} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId("menubar-title"));
    const input = screen.getByTestId("menubar-title-input");

    fireEvent.change(input, { target: { value: "Existing Board" } });
    fireEvent.blur(input);

    expect(screen.getByRole("alert")).toHaveTextContent("Name already taken");
    expect(screen.getByTestId("menubar-title-input")).toBeInTheDocument();
  });

  it("supports controlled renaming", () => {
    const onRenamingChange = vi.fn();
    const { rerender } = render(
      <MenuBar title="Controlled Title" isRenaming={false} onRenamingChange={onRenamingChange} />,
    );

    expect(screen.queryByTestId("menubar-title-input")).toBeNull();

    rerender(
      <MenuBar title="Controlled Title" isRenaming={true} onRenamingChange={onRenamingChange} />,
    );

    expect(screen.getByTestId("menubar-title-input")).toBeInTheDocument();
  });
});

function BarWithItems() {
  return (
    <header role="menubar" aria-label="App Menu" onKeyDown={menuBarKeyDown}>
      <button type="button" role="menuitem" data-testid="item-1">
        File
      </button>
      <button type="button" role="menuitem" data-testid="item-2">
        Edit
      </button>
      <button type="button" role="menuitem" data-testid="item-3">
        View
      </button>
    </header>
  );
}

describe("WAI-ARIA menubar keyboard traversal", () => {
  afterEach(() => {
    cleanup();
  });

  it("accepts role=menubar when provided", () => {
    render(<MenuBar role="menubar" aria-label="Application menu" />);
    expect(screen.getByRole("menubar")).toBeInTheDocument();
  });

  it("traverses items horizontally with ArrowRight and cycles from end to start", () => {
    render(<BarWithItems />);
    const item1 = screen.getByTestId("item-1");
    const item2 = screen.getByTestId("item-2");
    const item3 = screen.getByTestId("item-3");

    item1.focus();
    expect(item1).toHaveFocus();

    fireEvent.keyDown(item1, { key: "ArrowRight" });
    expect(item2).toHaveFocus();

    fireEvent.keyDown(item2, { key: "ArrowRight" });
    expect(item3).toHaveFocus();

    fireEvent.keyDown(item3, { key: "ArrowRight" });
    expect(item1).toHaveFocus();
  });

  it("traverses items backwards with ArrowLeft and cycles from start to end", () => {
    render(<BarWithItems />);
    const item1 = screen.getByTestId("item-1");
    const item2 = screen.getByTestId("item-2");
    const item3 = screen.getByTestId("item-3");

    item1.focus();
    fireEvent.keyDown(item1, { key: "ArrowLeft" });
    expect(item3).toHaveFocus();

    fireEvent.keyDown(item3, { key: "ArrowLeft" });
    expect(item2).toHaveFocus();
  });

  it("jumps to boundary items with Home and End", () => {
    render(<BarWithItems />);
    const item1 = screen.getByTestId("item-1");
    const item2 = screen.getByTestId("item-2");
    const item3 = screen.getByTestId("item-3");

    item2.focus();
    fireEvent.keyDown(item2, { key: "Home" });
    expect(item1).toHaveFocus();

    fireEvent.keyDown(item1, { key: "End" });
    expect(item3).toHaveFocus();
  });

  it("does not navigate menubar items with arrow keys while typing in an input", () => {
    render(
      <header role="menubar" onKeyDown={menuBarKeyDown}>
        <button type="button" role="menuitem" data-testid="btn-prev">
          Prev
        </button>
        <input type="text" data-testid="search-input" />
        <button type="button" role="menuitem" data-testid="btn-next">
          Next
        </button>
      </header>,
    );

    const input = screen.getByTestId("search-input");
    input.focus();

    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(input).toHaveFocus();
  });

  it("navigates directly within a MenuBar and skips items inside nested role=menu submenus", () => {
    render(
      <MenuBar
        title="Workspace"
        onOpenSearch={() => {}}
        sync={<SyncPill situation="synced" label="Saved" />}
        actions={
          <div className="relative">
            <button type="button" data-testid="bar-action">
              Actions
            </button>
            <div role="menu" data-testid="nested-menu">
              <button type="button" role="menuitem" data-testid="menu-item-1">
                Sub Item 1
              </button>
              <button type="button" role="menuitem" data-testid="menu-item-2">
                Sub Item 2
              </button>
            </div>
          </div>
        }
      />,
    );

    const titleBtn = screen.getByTestId("menubar-title");
    const searchBtn = screen.getByTestId("command-bar");
    const syncBtn = screen.getByTestId("sync-status");
    const actionBtn = screen.getByTestId("bar-action");

    titleBtn.focus();
    expect(titleBtn).toHaveFocus();

    // ArrowRight moves from title to command bar, NOT into the nested menu
    fireEvent.keyDown(titleBtn, { key: "ArrowRight" });
    expect(searchBtn).toHaveFocus();

    fireEvent.keyDown(searchBtn, { key: "ArrowRight" });
    expect(syncBtn).toHaveFocus();

    fireEvent.keyDown(syncBtn, { key: "ArrowRight" });
    expect(actionBtn).toHaveFocus();

    // From actionBtn, ArrowRight wraps around to titleBtn, skipping sub items
    fireEvent.keyDown(actionBtn, { key: "ArrowRight" });
    expect(titleBtn).toHaveFocus();

    // ArrowLeft backwards from title wraps to actionBtn
    fireEvent.keyDown(titleBtn, { key: "ArrowLeft" });
    expect(actionBtn).toHaveFocus();
  });

  it("handleMenuBarKeyDown handles submenus and escape", () => {
    const onOpenSubmenu = vi.fn();
    const onEscape = vi.fn();
    const onChangeFocus = vi.fn();

    const items = [document.createElement("button"), document.createElement("button")];

    // ArrowDown opens submenu
    const downEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
    handleMenuBarKeyDown(downEvent, items, 0, onChangeFocus, onOpenSubmenu, onEscape);
    expect(onOpenSubmenu).toHaveBeenCalledWith(0);

    // Escape dismisses
    const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
    handleMenuBarKeyDown(escEvent, items, 0, onChangeFocus, onOpenSubmenu, onEscape);
    expect(onEscape).toHaveBeenCalledTimes(1);

    // ArrowRight calls onChangeFocus
    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
    handleMenuBarKeyDown(rightEvent, items, 0, onChangeFocus, onOpenSubmenu, onEscape);
    expect(onChangeFocus).toHaveBeenCalledWith(1);
  });
});

describe("SyncPill presentation", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders situation and label", () => {
    render(<SyncPill situation="synced" label="Up to date" />);
    const pill = screen.getByTestId("sync-status");
    expect(pill).toHaveTextContent("Up to date");
    expect(pill).toHaveAttribute("data-status", "synced");
  });

  it("renders peer count when greater than 1", () => {
    render(<SyncPill situation="syncing" label="Syncing" peerCount={3} />);
    const pill = screen.getByTestId("sync-status");
    expect(pill).toHaveTextContent("Syncing· 3");
  });

  it("does not render peer count when 1 or omitted", () => {
    render(<SyncPill situation="syncing" label="Syncing" peerCount={1} />);
    const pill = screen.getByTestId("sync-status");
    expect(pill).toHaveTextContent("Syncing");
    expect(pill).not.toHaveTextContent("·");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<SyncPill situation="offline" label="Offline" onClick={onClick} />);
    fireEvent.click(screen.getByTestId("sync-status"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
