import type { ComponentProps } from "react";
import { cx } from "../cx.js";
import { FOCUS_RING } from "../tokens.js";

export type SyncSituation =
  | "synced"
  | "syncing"
  | "offline"
  | "conflict"
  | "local"
  | "connecting"
  | "asleep"
  | "waiting"
  | "refused"
  | "removed";

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

const SITUATION_DOT: Record<SyncSituation, string> = {
  synced: "bg-[var(--success)]",
  syncing: "bg-[var(--success)]",
  offline: "bg-[var(--ink-muted)]",
  conflict: "bg-[var(--danger)]",
  local: "bg-[var(--ink-muted)]",
  connecting: "bg-[var(--warning)]",
  asleep: "bg-[var(--warning)]",
  waiting: "bg-[var(--warning)]",
  refused: "bg-[var(--warning)]",
  removed: "bg-[var(--ink-muted)]",
};

/**
 * A presentation component for sync status and peer presence.
 *
 * Decoupled from any sync protocol or store: takes pure presentation facts
 * (`situation`, `label`, `peerCount`) and renders a compact pill control.
 */
export function SyncPill({
  situation,
  label,
  tooltip,
  peerCount,
  onClick,
  className,
  dotClassName,
  role,
  type = "button",
  "data-testid": testId = "sync-status",
  ...props
}: SyncPillProps) {
  const showPeers = peerCount !== undefined && peerCount > 1;

  return (
    <button
      type={type}
      data-testid={testId}
      data-handbook-region="sync-status"
      data-status={situation}
      data-role={role}
      title={tooltip ?? "Sync and people"}
      onClick={onClick}
      className={cx(
        "inline-flex h-6 select-none items-center gap-1.5 rounded-md px-1.5 text-[11px] leading-none text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-sunk)]",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cx(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          dotClassName ?? SITUATION_DOT[situation] ?? "bg-[var(--ink-muted)]",
        )}
      />
      {label}
      {showPeers ? <span className="tabular-nums">· {peerCount}</span> : null}
    </button>
  );
}
