import type { ButtonHTMLAttributes, ReactNode } from "react";
/**
 * A button that is one glyph.
 *
 * `label` is required rather than optional: an icon with no name is a control a screen reader
 * announces as "button", and making the prop mandatory is the only way to stop that being
 * forgotten at a call site.
 */
export type IconButtonSize = "sm" | "md";
export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
    /** The accessible name. Not a tooltip: it is what a screen reader reads. */
    readonly label: string;
    readonly size?: IconButtonSize;
    /** `quiet` is for a glyph inside a dense row; `plain` is a bordered control. */
    readonly variant?: "quiet" | "plain";
    readonly children: ReactNode;
}
export declare function IconButton({ label, size, variant, className, type, children, ...props }: IconButtonProps): import("react").JSX.Element;
//# sourceMappingURL=IconButton.d.ts.map