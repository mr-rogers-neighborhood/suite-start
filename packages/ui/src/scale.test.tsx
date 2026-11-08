import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button.js";
import { Field } from "./Field.js";
import { IconButton } from "./IconButton.js";
import { ImportMenu } from "./ImportMenu.js";
import { Launch } from "./Launch.js";

/**
 * Every primitive takes its space and its type from a custom property, with the value that
 * shipped as the fallback.
 *
 * Two things are being protected here. A host that never publishes the variables must render
 * exactly what it rendered before, which is the fallback. And a host that does publish them must
 * actually be obeyed, which is why the fallback cannot be the only value in the class.
 */
const SHIPPED = [
  { name: "control height", fallback: "2.25rem" },
  { name: "small control height", fallback: "2rem" },
  { name: "body type", fallback: "13px" },
] as const;

describe("primitives read the scale", () => {
  it("lets a host set the control height on a button", () => {
    render(<Button>Save</Button>);
    const className = screen.getByRole("button", { name: "Save" }).className;
    expect(className).toContain("var(--control-height,2.25rem)");
  });

  it("lets a host set the control height on an icon button, in both directions", () => {
    render(<IconButton label="More" size="md" icon={<span />} />);
    const className = screen.getByRole("button", { name: "More" }).className;
    // A square: height and width both come from the same variable, or the target stops being square.
    expect(className).toContain("h-[var(--control-height,2.25rem)]");
    expect(className).toContain("w-[var(--control-height,2.25rem)]");
  });

  it("lets a host set the height of a field", () => {
    render(<Field label="Name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Name").className).toContain("var(--control-height,2.25rem)");
  });

  it("keeps the shipped sizes as the fallbacks", () => {
    // A fallback that drifted from what shipped would be a silent redesign for every host that
    // has not adopted the scale yet.
    render(
      <Launch
        title="Suite Canvas"
        tagline="A canvas."
        actions={
          <>
            <Button>New</Button>
            <Button size="sm">Small</Button>
          </>
        }
        recents={[{ id: "1", name: "Recent", detail: "yesterday" }]}
      />,
    );
    const html = document.body.innerHTML;
    for (const { name, fallback } of SHIPPED) {
      expect(html.includes(fallback), `${name} should fall back to ${fallback}`).toBe(true);
    }
  });

  it("gives the import panel a row height a finger can hit", () => {
    render(
      <ImportMenu
        options={[
          { label: "A", onSelect: () => {} },
          { label: "B", onSelect: () => {} },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Import…" }));
    const item = screen.getByRole("button", { name: "A" }).className;
    expect(item).toContain("var(--row-padding-y,0.625rem)");
  });
});
