import { useEffect } from "react";
import { cx } from "./cx.js";
import { EDGE, INK, SURFACE } from "./tokens.js";

/**
 * One transient message, in the corner.
 *
 * The two apps disagreed about nearly everything here: Planner showed a bare string bottom
 * centre with an icon button, Budget a `{ message, tone }` bottom right with a `×`. The union
 * is a notice object with an optional tone, bottom right, and `role` that follows the tone —
 * `alert` for a failure, which a screen reader interrupts for, and `status` for the rest, which
 * it does not. Getting that pair the wrong way round is how a success message becomes an
 * interruption and an error becomes a whisper.
 */
export interface ToastNotice {
  readonly message: string;
  readonly tone?: "info" | "error";
}

export interface ToastProps {
  /** Null renders nothing. A notice is transient, so absence is a state, not an error. */
  readonly notice: ToastNotice | null;
  readonly onDismiss: () => void;
  /** How long it stays. Zero keeps it until dismissed, which a failure often should. */
  readonly duration?: number;
  readonly className?: string;
}

const DEFAULT_DURATION = 4500;

export function Toast({ notice, onDismiss, duration = DEFAULT_DURATION, className }: ToastProps) {
  useEffect(() => {
    if (notice === null || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [notice, duration, onDismiss]);

  if (notice === null) return null;
  const failed = notice.tone === "error";

  return (
    <div
      role={failed ? "alert" : "status"}
      className={cx(
        "fixed bottom-5 right-5 z-[80] flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-[13px] shadow-2xl",
        SURFACE.base,
        failed ? cx(EDGE.danger, INK.danger) : cx(EDGE.hairline, INK.base),
        className,
      )}
    >
      <p className="leading-relaxed">{notice.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cx(
          "shrink-0 text-[11px] transition-colors hover:text-[var(--ink)]",
          INK.muted,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        )}
      >
        ×
      </button>
    </div>
  );
}
