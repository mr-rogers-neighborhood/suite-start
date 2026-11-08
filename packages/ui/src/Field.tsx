import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cx } from "./cx.js";
import { EDGE, FOCUS_RING, INK, SURFACE } from "./tokens.js";

/**
 * A label, a control, a hint and an error, as one unit.
 *
 * The point is not the layout, it is that the wiring cannot be forgotten: the label gets the
 * `htmlFor` the input gets the `id`, the hint is `aria-describedby`, and an error is both
 * described and marked `aria-invalid`. Every app has a form somewhere that leaves one of those
 * out, and a shared `Field` is the only version that cannot.
 */
export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  readonly label: string;
  /** What the value should be, when that is not obvious. Announced with the input. */
  readonly hint?: ReactNode;
  /** What is wrong with it. Presence also sets `aria-invalid`. */
  readonly error?: ReactNode;
  /** Rendered after the input: a suffix, a unit, a picker. */
  readonly trailing?: ReactNode;
  /** Forces an id when a caller needs to reference the input from elsewhere. */
  readonly id?: string;
}

export function Field({ label, hint, error, trailing, id, className, ...props }: FieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter((value): value is string => value !== null)
    .join(" ");

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={fieldId}
        className={cx("text-[length:var(--text-label,12px)] font-medium", INK.base)}
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={fieldId}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy.length === 0 ? undefined : describedBy}
          className={cx(
            "h-[var(--control-height,2.25rem)] w-full rounded-lg border px-[var(--control-padding-x,0.75rem)] text-[length:var(--text-body,13px)] transition-colors",
            SURFACE.base,
            INK.base,
            FOCUS_RING,
            // An input's edge is the only thing saying "you can type here", so it is a
            // component boundary and clears 3:1 — `hairline` would not.
            error === undefined ? EDGE.strong : EDGE.danger,
            "placeholder:text-[var(--ink-faint)]",
            "disabled:opacity-50",
          )}
          {...props}
        />
        {trailing}
      </div>
      {hint === undefined ? null : (
        <p id={hintId} className={cx("text-[length:var(--text-caption,11px)]", INK.muted)}>
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={errorId} className={cx("text-[length:var(--text-caption,11px)]", INK.danger)}>
          {error}
        </p>
      )}
    </div>
  );
}
