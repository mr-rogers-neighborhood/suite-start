import type { ReactNode } from "react";
import { cx } from "./cx.js";
import { Modal } from "./Modal.js";
import { INK } from "./tokens.js";

/**
 * A titled modal with a body and an action row.
 *
 * The five dialogs in the budget app — new budget, account, move money, reconcile, import —
 * are all this shape, and each one had written its own frame. Naming the shape once is what
 * makes them look like one application.
 */
export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  /** One sentence under the title, when the title alone is not enough. */
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  /** Buttons, right-aligned. The confirming action goes last. */
  readonly actions?: ReactNode;
  readonly size?: "sm" | "md" | "lg";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = "md",
}: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} label={title} size={size}>
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {description === undefined ? null : (
        <p className={cx("mt-1 text-[12px] leading-5", INK.muted)}>{description}</p>
      )}
      {children === undefined ? null : <div className="mt-4">{children}</div>}
      {actions === undefined ? null : (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">{actions}</div>
      )}
    </Modal>
  );
}
