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
export declare const SURFACE: {
    readonly canvas: "bg-[var(--canvas)]";
    readonly base: "bg-[var(--surface)]";
    readonly sunk: "bg-[var(--surface-sunk)]";
    readonly strong: "bg-[var(--surface-strong)]";
};
/** The ink for each paint, from `PAINT_INK`. Never `text-white`. */
export declare const INK_ON: {
    readonly canvas: "text-[var(--ink)]";
    readonly base: "text-[var(--ink)]";
    readonly sunk: "text-[var(--ink)]";
    readonly strong: "text-[var(--ink)]";
    readonly accent: "text-[var(--on-accent)]";
    readonly danger: "text-[var(--on-danger)]";
    readonly success: "text-[var(--on-success)]";
    readonly warning: "text-[var(--on-warning)]";
};
/** Lines. `hairline` is a divider; `border` is an edge that carries meaning. */
export declare const EDGE: {
    readonly hairline: "border-[var(--hairline)]";
    readonly strong: "border-[var(--border-strong)]";
    readonly accent: "border-[var(--accent)]";
    readonly danger: "border-[var(--danger)]";
    readonly none: "border-transparent";
};
export declare const INK: {
    readonly base: "text-[var(--ink)]";
    readonly muted: "text-[var(--ink-muted)]";
    readonly faint: "text-[var(--ink-faint)]";
    readonly accent: "text-[var(--accent)]";
    readonly danger: "text-[var(--danger)]";
};
/**
 * The focus ring, on the role the contrast gate holds to 3:1 against every surface.
 *
 * One definition, so a control cannot ship without one and two controls cannot disagree about
 * what focus looks like.
 */
export declare const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]";
/** Shared by every pressable thing: no text selection, no pointer events when disabled. */
export declare const PRESSABLE = "inline-flex select-none items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";
//# sourceMappingURL=tokens.d.ts.map