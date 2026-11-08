import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, INK_ON, PRESSABLE, SURFACE } from "./tokens.js";

/**
 * A button.
 *
 * Four variants, which is the union of what the apps had separately: Planner shipped
 * `primary · ghost · quiet` and Budget `primary · secondary · ghost · danger`, and the two
 * disagreed about ink on the filled one — `text-white` against `text-[#07130d]`. Both were
 * wrong under any preset they were not tuned for (2.53:1 and 3.47:1), which is why the ink
 * here comes from `INK_ON` and never from a literal.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** A glyph before the label. Decorative, so give the button an accessible name in text. */
  readonly icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // One background per variant, never two: two `bg-*` classes resolve by Tailwind's own
  // source order, not by the order they are written, so a pair would be a coin toss.
  primary: cx("bg-[var(--accent)]", INK_ON.accent, EDGE.none, "hover:bg-[var(--accent-strong)]"),
  secondary: cx(SURFACE.base, INK.base, EDGE.strong, "hover:bg-[var(--surface-sunk)]"),
  ghost: cx(
    "bg-transparent",
    INK.muted,
    EDGE.none,
    "hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
  ),
  danger: cx("bg-[var(--danger)]", INK_ON.danger, EDGE.none, "hover:brightness-95"),
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-2.5 text-[12px]",
  md: "h-9 gap-2 rounded-lg px-3 text-[13px]",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        PRESSABLE,
        "shrink-0 whitespace-nowrap border",
        FOCUS_RING,
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon === undefined ? null : <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
