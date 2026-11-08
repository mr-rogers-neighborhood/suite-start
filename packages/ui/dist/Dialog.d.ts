import type { ReactNode } from "react";
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
export declare function Dialog({ open, onClose, title, description, children, actions, size, }: DialogProps): import("react").JSX.Element;
//# sourceMappingURL=Dialog.d.ts.map