import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppMark } from "./AppMark.js";

/** A stand-in for real artwork: one shape, in the glyph's own coordinate space. */
const GLYPH = { viewBox: "0 0 24 24", paths: ["M4 4h16v16H4z"] } as const;

describe("AppMark", () => {
  it("paints the tile with the accent and the glyph with its ink", () => {
    const { container } = render(<AppMark {...GLYPH} />);
    const tile = container.firstElementChild as HTMLElement;
    // Not a Tailwind theme name and not a hex: a preset has to be able to reach it.
    expect(tile.className).toContain("bg-[var(--accent)]");
    expect(tile.className).toContain("text-[var(--on-accent)]");
  });

  it("inherits the glyph's colour rather than naming one", () => {
    const { container } = render(<AppMark {...GLYPH} />);
    // `fill="#fff"` is what made the old artwork unusable in light mode.
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("is decoration when a name is written beside it", () => {
    const { container } = render(<AppMark {...GLYPH} />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("names itself when nothing else does", () => {
    render(<AppMark {...GLYPH} label="Suite Planner" />);
    expect(screen.getByRole("img", { name: "Suite Planner" })).toBeInTheDocument();
  });

  it("draws every path it is given", () => {
    const { container } = render(
      <AppMark viewBox="0 0 36 36" paths={["M0 0h36v36H0z", "M4 4h28v28H4z"]} />,
    );
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("takes the glyph's own coordinate space", () => {
    const { container } = render(<AppMark viewBox="0 0 32 32" paths={["M0 0h32v32H0z"]} />);
    // The three apps drew their artwork at 24, 36 and 32; one component has to accept all of them.
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 32 32");
  });

  it("sizes the tile and the glyph together", () => {
    const { container } = render(<AppMark {...GLYPH} size="lg" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain("h-12");
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("h-7");
  });

  it("keeps a caller's own class", () => {
    const { container } = render(<AppMark {...GLYPH} className="mt-1" />);
    expect((container.firstElementChild as HTMLElement).className).toContain("mt-1");
  });
});
