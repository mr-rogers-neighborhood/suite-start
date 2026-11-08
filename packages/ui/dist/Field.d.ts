import { type InputHTMLAttributes, type ReactNode } from "react";
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
export declare function Field({ label, hint, error, trailing, id, className, ...props }: FieldProps): import("react").JSX.Element;
//# sourceMappingURL=Field.d.ts.map