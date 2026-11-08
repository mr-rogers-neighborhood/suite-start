import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button.js";
import { cx } from "./cx.js";
import { EDGE, INK, PRESSABLE, SURFACE } from "./tokens.js";

/** One thing an app can import, and what to do when it is chosen. */
export interface ImportOption {
  /** How the entry reads in the menu: "Obsidian vault", "Suite canvas". */
  readonly label: string;
  /** One line under the label, for the case where the label alone is ambiguous. */
  readonly detail?: string;
  readonly onSelect: () => void;
}

export interface ImportMenuProps {
  readonly options: readonly ImportOption[];
  /**
   * The trigger's label. "Import" by default; an app may say what it imports.
   *
   * The ellipsis is added here rather than by the caller, because a label that opens a menu
   * needs one and a caller who forgets is invisible until someone reads the screen.
   */
  readonly label?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * A trigger that offers several ways to bring material in.
 *
 * Deliberately a **disclosure**, not `role="menu"`. A menu role promises arrow-key travel
 * between items, Home/End, and typeahead; a disclosure promises that Tab reaches each item and
 * Escape closes it. The second promise is the one this control keeps, and a control that claims
 * the first without keeping it is worse for a screen reader than one that claims less.
 *
 * With a single option there is no menu: a menu holding one item is a click that buys nothing,
 * so the trigger becomes the action.
 */
export function ImportMenu({
  options,
  label = "Import",
  disabled = false,
  className,
}: ImportMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);

  // Close on a press outside, or on Escape wherever focus happens to be.
  //
  // Both live on the document rather than on the panel: Escape must work while focus is still
  // on the trigger, and a keydown handler on a plain container is an interaction on a static
  // element, which asks a reader to infer an affordance the markup never claimed.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.current?.contains(target) === true) return;
      if (trigger.current?.contains(target) === true) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus into the panel when it opens, so a keyboard user is not left behind the trigger.
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("button")?.focus();
  }, [open]);

  if (options.length === 0) return null;

  if (options.length === 1) {
    const only = options[0] as ImportOption;
    return (
      <Button variant="secondary" onClick={only.onSelect} disabled={disabled} className={className}>
        {label}…
      </Button>
    );
  }

  return (
    <div className={cx("relative", className)}>
      <Button
        ref={trigger}
        variant="secondary"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((was) => !was)}
      >
        {label}…
      </Button>
      {open ? (
        <div
          ref={panel}
          id={panelId}
          className={cx(
            "absolute left-0 z-20 mt-1 flex min-w-[220px] flex-col gap-0.5 rounded-lg p-1 shadow-lg",
            SURFACE.base,
            "border",
            EDGE.strong,
          )}
        >
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setOpen(false);
                option.onSelect();
              }}
              className={cx(
                "flex flex-col items-start rounded-md px-2.5 py-1.5 text-left",
                PRESSABLE,
                "hover:bg-[var(--surface-sunk)] focus-visible:bg-[var(--surface-sunk)]",
                INK.base,
              )}
            >
              <span className="text-[13px] font-medium">{option.label}</span>
              {option.detail === undefined ? null : (
                <span className={cx("text-[11px]", INK.muted)}>{option.detail}</span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
