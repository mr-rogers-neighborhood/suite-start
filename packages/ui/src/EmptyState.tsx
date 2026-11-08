import type { ReactNode } from "react";
import { cx } from "./cx.js";
import { INK } from "./tokens.js";

/**
 * The "nothing here yet" panel.
 *
 * A dashed edge rather than a filled one: an empty state is a place where something will go,
 * not a thing that exists. Every app had its own, with different padding and its own idea of
 * how loud to be, which made the suite look like four products on the same screen it was most
 * likely to be seen — a first run.
 */
export interface EmptyStateProps {
  readonly title: string;
  /** One sentence: what will appear here, and what makes it appear. */
  readonly children?: ReactNode;
  /** A button or link, when there is something to do about the emptiness. */
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ title, children, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-dashed border-[var(--hairline)] px-6 py-8 text-center",
        className,
      )}
    >
      <p className={cx("text-[13px] font-medium", INK.base)}>{title}</p>
      {children === undefined ? null : (
        <p className={cx("mx-auto mt-1 max-w-[46ch] text-[12px]", INK.muted)}>{children}</p>
      )}
      {action === undefined ? null : <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
