import { type ReactNode } from "react";
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
export declare function Modal({ open, onClose, label, children, size, className }: ModalProps): import("react").ReactPortal | null;
//# sourceMappingURL=Modal.d.ts.map