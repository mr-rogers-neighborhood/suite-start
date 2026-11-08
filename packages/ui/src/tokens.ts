/**
 * How a primitive names a colour.
 *
 * Every value is `var(--role)`, never a Tailwind theme name and never a hex. That is the rule
 * that makes one component work in four apps: three of them extend Tailwind's `@theme` with
 * their own names (`bg-panel`, `bg-raised`, `text-faint`) and Start has no Tailwind at all, so
 * anything but a CSS variable would compile in two apps and silently do nothing in the third.
 *
 * It also means a primitive cannot hardcode the ink on a filled surface, which is the bug this
 * package exists to prevent: `PAINT_INK` in `@suite/theme` already says which ink belongs on
 * which paint, and these are those answers as classes.
 */

/** A surface a control or panel can be painted with. */
export const SURFACE = {
  canvas: "bg-[var(--canvas)]",
  base: "bg-[var(--surface)]",
  sunk: "bg-[var(--surface-sunk)]",
  strong: "bg-[var(--surface-strong)]",
} as const;

/** The ink for each paint, from `PAINT_INK`. Never `text-white`. */
export const INK_ON = {
  canvas: "text-[var(--ink)]",
  base: "text-[var(--ink)]",
  sunk: "text-[var(--ink)]",
  strong: "text-[var(--ink)]",
  accent: "text-[var(--on-accent)]",
  danger: "text-[var(--on-danger)]",
  success: "text-[var(--on-success)]",
  warning: "text-[var(--on-warning)]",
} as const;

/** Lines. `hairline` is a divider; `border` is an edge that carries meaning. */
export const EDGE = {
  hairline: "border-[var(--hairline)]",
  strong: "border-[var(--border-strong)]",
  accent: "border-[var(--accent)]",
  danger: "border-[var(--danger)]",
  none: "border-transparent",
} as const;

export const INK = {
  base: "text-[var(--ink)]",
  muted: "text-[var(--ink-muted)]",
  faint: "text-[var(--ink-faint)]",
  accent: "text-[var(--accent)]",
  danger: "text-[var(--danger)]",
} as const;

/**
 * The focus ring, on the role the contrast gate holds to 3:1 against every surface.
 *
 * One definition, so a control cannot ship without one and two controls cannot disagree about
 * what focus looks like.
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]";

/** Shared by every pressable thing: no text selection, no pointer events when disabled. */
export const PRESSABLE =
  "inline-flex select-none items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";
