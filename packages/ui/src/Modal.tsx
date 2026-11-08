import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx.js";
import { EDGE, INK, SURFACE } from "./tokens.js";

/**
 * A dialog surface: the backdrop, the focus trap, Escape, and the ARIA.
 *
 * The behaviours here are the ones every hand-written modal gets subtly wrong. Focus moves in
 * on open and returns to whatever had it on close, Tab wraps inside the panel, Escape closes,
 * and the click-away backdrop is a real button so it is reachable by a screen reader rather
 * than a `div` with an `onClick`. An app that has its own modal keeps it; this is for the five
 * dialogs that are all the same shape.
 */
export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Read aloud on open, and the panel's accessible name. */
  readonly label: string;
  readonly children: ReactNode;
  /** `sm` fits a confirm; `md` a form; `lg` a wizard step. */
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}

const SIZES = {
  sm: "w-[min(400px,calc(100vw-2rem))]",
  md: "w-[min(560px,calc(100vw-2rem))]",
  lg: "w-[min(760px,calc(100vw-2rem))]",
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, label, children, size = "md", className }: ModalProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current;
    first?.focus();
    return () => restoreTo.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || panel.current === null) return;
      // Wrap inside the panel: without this, Tab walks out into the page behind the dialog,
      // which is still visible but not reachable by anything else.
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null,
      );
      const first = items[0];
      const last = items.at(-1);
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <button
        type="button"
        aria-label={`Close ${label}`}
        className="absolute inset-0 cursor-default border-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx(
          "relative max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border p-5 shadow-2xl",
          SURFACE.base,
          EDGE.hairline,
          INK.base,
          SIZES[size],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
