import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog.js";
import { Modal } from "./Modal.js";

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal open={false} onClose={() => {}} label="Settings">
        body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a modal dialog with a name", () => {
    render(
      <Modal open onClose={() => {}} label="Settings">
        <p>body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} label="Settings">
        <p>body</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gives focus to the first control, not to the page behind it", () => {
    render(
      <Modal open onClose={() => {}} label="Settings">
        <button type="button">First</button>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("offers a real button to dismiss by clicking away", () => {
    render(
      <Modal open onClose={() => {}} label="Settings">
        <p>body</p>
      </Modal>,
    );
    // A real button, so it is reachable rather than a div with a click handler.
    expect(screen.getByRole("button", { name: "Close Settings" })).toBeInTheDocument();
  });

  it("returns focus to whatever had it, on close", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(
      <Modal open onClose={() => {}} label="Settings">
        <button type="button">First</button>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    rerender(
      <Modal open={false} onClose={() => {}} label="Settings">
        <button type="button">First</button>
      </Modal>,
    );
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

describe("Dialog", () => {
  it("is the modal plus a title, a body and an action row", () => {
    render(
      <Dialog
        open
        onClose={() => {}}
        title="Move money"
        description="From one envelope to another."
        actions={<button type="button">Move</button>}
      >
        <p>fields</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Move money" })).toBeInTheDocument();
    expect(screen.getByText("From one envelope to another.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  });

  it("works without a description or a body", () => {
    render(<Dialog open onClose={() => {}} title="Delete?" />);
    expect(screen.getByRole("dialog", { name: "Delete?" })).toBeInTheDocument();
  });
});
