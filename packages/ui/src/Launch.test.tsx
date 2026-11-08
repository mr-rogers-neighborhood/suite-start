import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Launch } from "./Launch.js";

const base = {
  // A themed mark, not a URL: an `<img>` is a separate document and cannot inherit colour.
  mark: <span data-testid="mark" aria-hidden="true" />,
  title: "Suite Canvas",
  tagline: "A canvas for connected thinking.",
  hint: "Open a canvas file, pick up a recent one, or choose a starter template.",
};

describe("Launch", () => {
  it("names the app and says what it is", () => {
    render(<Launch {...base} />);
    expect(screen.getByRole("heading", { level: 1, name: "Suite Canvas" })).toBeInTheDocument();
    expect(screen.getByText("A canvas for connected thinking.")).toBeInTheDocument();
    expect(screen.getByText(/choose a starter template/u)).toBeInTheDocument();
  });

  it("renders whatever mark it is given", () => {
    // The caller owns the mark's accessibility: an `AppMark` with no label is already
    // decoration, and one with a label names itself.
    render(<Launch {...base} />);
    expect(screen.getByTestId("mark")).toBeInTheDocument();
  });

  it("offers the actions it is given", () => {
    render(
      <Launch
        {...base}
        actions={
          <>
            <button type="button">New canvas</button>
            <button type="button">Open canvas file…</button>
          </>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "New canvas" })).toBeInTheDocument();
  });

  it("opens a recent by id, not by name", () => {
    const onOpenRecent = vi.fn();
    render(
      <Launch
        {...base}
        recents={[
          { id: "ws-1", name: "Research", detail: "Canvas · opened yesterday" },
          { id: "ws-2", name: "Reading", detail: "Canvas · opened last week" },
        ]}
        onOpenRecent={onOpenRecent}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Research/u }));
    expect(onOpenRecent).toHaveBeenCalledWith("ws-1");
  });

  it("shows the app's empty state when there is no history", () => {
    render(<Launch {...base} recentEmpty={<p>Nothing opened yet.</p>} />);
    expect(screen.getByText("Nothing opened yet.")).toBeInTheDocument();
  });

  it("leaves the history out entirely when there is neither list nor empty state", () => {
    render(<Launch {...base} />);
    expect(screen.queryByText(/Nothing opened/u)).toBeNull();
  });

  it("carries a notice above everything, such as an alpha warning", () => {
    render(<Launch {...base} notice={<p>Suite is alpha software.</p>} />);
    expect(screen.getByText("Suite is alpha software.")).toBeInTheDocument();
  });

  it("takes app-specific content as children", () => {
    render(
      <Launch {...base}>
        <section>Starter templates</section>
      </Launch>,
    );
    expect(screen.getByText("Starter templates")).toBeInTheDocument();
  });
});
