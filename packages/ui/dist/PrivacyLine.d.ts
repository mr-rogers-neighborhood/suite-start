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
export declare const PRIVACY_SENTENCE = "Local file. No account, no server, no telemetry.";
export interface PrivacyLineProps {
    /** A path or workspace name to show above the claim, when there is one worth showing. */
    readonly where?: string;
    readonly className?: string;
    /** Omits the sentence and shows only `where`, for a caller that says it elsewhere. */
    readonly sentence?: boolean;
}
export declare function PrivacyLine({ where, className, sentence }: PrivacyLineProps): import("react").JSX.Element;
//# sourceMappingURL=PrivacyLine.d.ts.map