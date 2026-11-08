/**
 * One transient message, in the corner.
 *
 * The two apps disagreed about nearly everything here: Planner showed a bare string bottom
 * centre with an icon button, Budget a `{ message, tone }` bottom right with a `×`. The union
 * is a notice object with an optional tone, bottom right, and `role` that follows the tone —
 * `alert` for a failure, which a screen reader interrupts for, and `status` for the rest, which
 * it does not. Getting that pair the wrong way round is how a success message becomes an
 * interruption and an error becomes a whisper.
 */
export interface ToastNotice {
    readonly message: string;
    readonly tone?: "info" | "error";
}
export interface ToastProps {
    /** Null renders nothing. A notice is transient, so absence is a state, not an error. */
    readonly notice: ToastNotice | null;
    readonly onDismiss: () => void;
    /** How long it stays. Zero keeps it until dismissed, which a failure often should. */
    readonly duration?: number;
    readonly className?: string;
}
export declare function Toast({ notice, onDismiss, duration, className }: ToastProps): import("react").JSX.Element | null;
//# sourceMappingURL=Toast.d.ts.map