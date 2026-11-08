import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImportMenu } from "./ImportMenu.js";

const vault = { label: "Obsidian vault", detail: "Markdown files", onSelect: () => {} };
const canvas = { label: "Suite canvas", detail: "Add its cards here", onSelect: () => {} };

describe("ImportMenu", () => {
  it("renders nothing when there is nothing to import", () => {
    const { container } = render(<ImportMenu options={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a plain button when there is one path, not a menu of one", () => {
    const onSelect = vi.fn();
    render(<ImportMenu options={[{ label: "Bank export", onSelect }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Import…" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("promises only what it keeps: a disclosure, not a menu", () => {
    // `role="menu"` would promise arrow-key travel and typeahead. Tab reaches these items,
    // so the control must not claim menu semantics it does not implement.
    render(<ImportMenu options={[vault, canvas]} />);
    const trigger = screen.getByRole("button", { name: "Import…" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Obsidian vault/u })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Suite canvas/u })).toBeInTheDocument();
  });

  it("closes on a choice and calls it once", () => {
    const onSelect = vi.fn();
    render(<ImportMenu options={[{ ...vault, onSelect }, canvas]} />);
    fireEvent.click(screen.getByRole("button", { name: "Import…" }));
    fireEvent.click(screen.getByRole("button", { name: /Obsidian vault/u }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /Suite canvas/u })).not.toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the trigger", () => {
    render(<ImportMenu options={[vault, canvas]} />);
    const trigger = screen.getByRole("button", { name: "Import…" });
    fireEvent.click(trigger);

    const item = screen.getByRole("button", { name: /Obsidian vault/u });
    fireEvent.keyDown(item, { key: "Escape" });

    expect(screen.queryByRole("button", { name: /Suite canvas/u })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when the press lands outside it", () => {
    render(
      <div>
        <ImportMenu options={[vault, canvas]} />
        <button type="button">elsewhere</button>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Import…" }));
    expect(screen.getByRole("button", { name: /Suite canvas/u })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.queryByRole("button", { name: /Suite canvas/u })).not.toBeInTheDocument();
  });

  it("moves focus into the panel when it opens", () => {
    render(<ImportMenu options={[vault, canvas]} />);
    fireEvent.click(screen.getByRole("button", { name: "Import…" }));
    expect(screen.getByRole("button", { name: /Obsidian vault/u })).toHaveFocus();
  });
});
