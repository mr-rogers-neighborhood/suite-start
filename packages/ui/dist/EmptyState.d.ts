import type { ReactNode } from "react";
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
export declare function EmptyState({ title, children, action, className }: EmptyStateProps): import("react").JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map