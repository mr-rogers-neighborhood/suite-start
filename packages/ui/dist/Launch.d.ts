import { type ReactNode } from "react";
/**
 * The screen a person lands on when no document is open.
 *
 * Canvas and Budget already had the same skeleton and had each drawn it themselves: a mark, a
 * heading, a two-line tagline split by a rule, a row of primary actions, a recents list with a
 * row action, an empty state for when there are none, and a footer. The names, the rules and
 * the spacing differed; the shape did not.
 *
 * What stays with the app is everything that makes it *that* app: Canvas's starter templates
 * and vault import, whatever Budget puts beside its New button. Those arrive as `children`, so
 * this owns the frame and the app owns its content. If a slot does not fit an app, that app
 * keeps its own launcher and this loses one consumer rather than forcing a bad abstraction.
 */
export interface LaunchRecent {
    readonly id: string;
    /** The primary line. A workspace or budget name, not a file path. */
    readonly name: string;
    /** The muted line under it: what kind of thing it is, and when it was opened. */
    readonly detail?: string;
    /** One control per row, usually a menu or a forget button. */
    readonly action?: ReactNode;
}
export interface LaunchProps {
    /** The app's own mark, as a URL. Omitted, the heading simply starts further left. */
    readonly mark?: string;
    /** The app's name. */
    readonly title: string;
    /** One line, in the app's own words, above the rule. */
    readonly tagline: string;
    /** One line below the rule: how to begin. */
    readonly hint?: string;
    /** Primary actions: New, Open. */
    readonly actions?: ReactNode;
    /** What to show when there is no history. Omitted, the list is simply absent. */
    readonly recentEmpty?: ReactNode;
    readonly recents?: readonly LaunchRecent[];
    readonly onOpenRecent?: (id: string) => void;
    /** Headed section between the actions and the history, for app-specific content. */
    readonly children?: ReactNode;
    readonly footer?: ReactNode;
    /** A notice that sits above everything, such as an alpha warning. */
    readonly notice?: ReactNode;
    readonly className?: string;
}
export declare function Launch({ mark, title, tagline, hint, actions, recentEmpty, recents, onOpenRecent, children, footer, notice, className, }: LaunchProps): import("react").JSX.Element;
//# sourceMappingURL=Launch.d.ts.map