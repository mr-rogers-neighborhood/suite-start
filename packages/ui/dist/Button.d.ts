import type { ButtonHTMLAttributes, ReactNode } from "react";
/**
 * A button.
 *
 * Four variants, which is the union of what the apps had separately: Planner shipped
 * `primary · ghost · quiet` and Budget `primary · secondary · ghost · danger`, and the two
 * disagreed about ink on the filled one — `text-white` against `text-[#07130d]`. Both were
 * wrong under any preset they were not tuned for (2.53:1 and 3.47:1), which is why the ink
 * here comes from `INK_ON` and never from a literal.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    readonly variant?: ButtonVariant;
    readonly size?: ButtonSize;
    /** A glyph before the label. Decorative, so give the button an accessible name in text. */
    readonly icon?: ReactNode;
}
export declare function Button({ variant, size, icon, className, type, children, ...props }: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=Button.d.ts.map