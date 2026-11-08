import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, PRESSABLE, SURFACE } from "./tokens.js";

/**
 * A button that is one glyph.
 *
 * `label` is required rather than optional: an icon with no name is a control a screen reader
 * announces as "button", and making the prop mandatory is the only way to stop that being
 * forgotten at a call site.
 */
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
  /** The accessible name. Not a tooltip: it is what a screen reader reads. */
  readonly label: string;
  readonly size?: IconButtonSize;
  /** `quiet` is for a glyph inside a dense row; `plain` is a bordered control. */
  readonly variant?: "quiet" | "plain";
  readonly children: ReactNode;
}

const SIZES: Record<IconButtonSize, string> = {
  sm: "h-[var(--control-height-sm,2rem)] w-[var(--control-height-sm,2rem)] rounded-md",
  md: "h-[var(--control-height,2.25rem)] w-[var(--control-height,2.25rem)] rounded-lg",
};

export function IconButton({
  label,
  size = "sm",
  variant = "quiet",
  className,
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={props.title ?? label}
      className={cx(
        PRESSABLE,
        "shrink-0 border",
        FOCUS_RING,
        SIZES[size],
        variant === "plain"
          ? cx(SURFACE.base, EDGE.strong, INK.base, "hover:bg-[var(--surface-sunk)]")
          : cx(
              "bg-transparent",
              EDGE.none,
              INK.muted,
              "hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
            ),
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
