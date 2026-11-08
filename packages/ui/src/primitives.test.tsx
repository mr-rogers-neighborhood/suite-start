import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState.js";
import { Field } from "./Field.js";
import { IconButton } from "./IconButton.js";

describe("IconButton", () => {
  it("always has an accessible name", () => {
    render(
      <IconButton label="Dismiss">
        <span>x</span>
      </IconButton>,
    );
    // An icon with no name is announced as "button", which is why `label` is required.
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("hides the glyph from the accessibility tree", () => {
    const { container } = render(
      <IconButton label="Dismiss">
        <svg />
      </IconButton>,
    );
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("Field", () => {
  it("gives the label and the input the same id", () => {
    render(<Field label="Amount" />);
    // `getByLabelText` only finds the input if `htmlFor` and `id` agree.
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
  });

  it("describes the input with its hint", () => {
    render(<Field label="Amount" hint="In your own currency" />);
    expect(screen.getByLabelText("Amount")).toHaveAccessibleDescription("In your own currency");
  });

  it("marks the input invalid and describes the reason", () => {
    render(<Field label="Amount" error="That is not a number" />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("That is not a number");
  });

  it("describes with both when a hint and an error are present", () => {
    render(<Field label="Amount" hint="In your own currency" error="That is not a number" />);
    expect(screen.getByLabelText("Amount")).toHaveAccessibleDescription(
      "In your own currency That is not a number",
    );
  });

  it("is not invalid when nothing is wrong", () => {
    render(<Field label="Amount" />);
    expect(screen.getByLabelText("Amount")).toHaveAttribute("aria-invalid", "false");
  });

  it("forwards the value and the change handler", () => {
    const onChange = vi.fn();
    render(<Field label="Amount" value="12" onChange={onChange} />);
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("12");
    fireEvent.change(input, { target: { value: "13" } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe("EmptyState", () => {
  it("names what is empty and what fills it", () => {
    render(<EmptyState title="No budgets yet">Create one to begin.</EmptyState>);
    expect(screen.getByText("No budgets yet")).toBeInTheDocument();
    expect(screen.getByText("Create one to begin.")).toBeInTheDocument();
  });

  it("carries its action when there is something to do", () => {
    render(
      <EmptyState title="Nothing here" action={<button type="button">Create</button>}>
        Nothing yet.
      </EmptyState>,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});
