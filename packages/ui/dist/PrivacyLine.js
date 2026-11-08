import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function PrivacyLine({ where, className, sentence = true }) {
    return (_jsxs("div", { className: cx("flex min-w-0 flex-col gap-0.5 text-[11px]", INK.faint, className), children: [where === undefined ? null : (_jsx("span", { className: "truncate", title: where, children: where })), sentence ? _jsx("span", { children: PRIVACY_SENTENCE }) : null] }));
}
//# sourceMappingURL=PrivacyLine.js.map