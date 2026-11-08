import { cx } from "./cx.js";
import { INK } from "./tokens.js";

/**
 * The one claim the suite makes about itself, said the same way in every app.
 *
 * Each app already said it, and each said it differently: "Local workspace", "Local file · no
 * network", "Local budgets · no account · no network", "Local only". Four phrasings of one fact
 * is how a person starts to wonder whether they mean the same thing.
 *
 * The sentence is short on purpose. A privacy claim that explains itself reads as a defence, and
 * one that lists everything it does not do invites the reader to look for what it left out.
 */
export const PRIVACY_SENTENCE = "Local file. No account, no server, no telemetry.";

export interface PrivacyLineProps {
  /** A path or workspace name to show above the claim, when there is one worth showing. */
  readonly where?: string;
  readonly className?: string;
  /** Omits the sentence and shows only `where`, for a caller that says it elsewhere. */
  readonly sentence?: boolean;
}

export function PrivacyLine({ where, className, sentence = true }: PrivacyLineProps) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-0.5 text-[11px]", INK.faint, className)}>
      {where === undefined ? null : (
        <span className="truncate" title={where}>
          {where}
        </span>
      )}
      {sentence ? <span>{PRIVACY_SENTENCE}</span> : null}
    </div>
  );
}
