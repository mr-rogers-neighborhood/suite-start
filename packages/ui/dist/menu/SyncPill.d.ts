import type { ComponentProps } from "react";
export type SyncSituation = "synced" | "syncing" | "offline" | "conflict" | "local" | "connecting" | "asleep" | "waiting" | "refused" | "removed";
export interface SyncPillProps extends Omit<ComponentProps<"button">, "children" | "role"> {
    readonly situation: SyncSituation;
    readonly label: string;
    readonly tooltip?: string | undefined;
    readonly peerCount?: number | undefined;
    readonly onClick?: (() => void) | undefined;
    readonly className?: string | undefined;
    readonly dotClassName?: string | undefined;
    /** Role annotation for share link status panel ("editor" | "viewer") */
    readonly role?: string | undefined;
    readonly "data-testid"?: string | undefined;
    readonly "data-handbook-region"?: string | undefined;
}
/**
 * A presentation component for sync status and peer presence.
 *
 * Decoupled from any sync protocol or store: takes pure presentation facts
 * (`situation`, `label`, `peerCount`) and renders a compact pill control.
 */
export declare function SyncPill({ situation, label, tooltip, peerCount, onClick, className, dotClassName, role, type, "data-testid": testId, ...props }: SyncPillProps): import("react").JSX.Element;
//# sourceMappingURL=SyncPill.d.ts.map