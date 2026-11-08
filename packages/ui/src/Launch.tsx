import { type ReactNode, useId } from "react";
import { cx } from "./cx.js";
import { INK } from "./tokens.js";

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
  /**
   * The app's own mark.
   *
   * A node rather than a URL: an `<img>` is a separate document and cannot inherit
   * `currentColor`, so a themed mark could never be an image. Each app passes its own
   * `AppMark` — which is how the launcher stops showing the suite logo on an app's screen.
   */
  readonly mark?: ReactNode;
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
  /**
   * The chrome around the content.
   *
   * `page` is a column on the canvas; `card` a centred panel with a shadow, which is what a
   * canvas-style launcher wants; `bar` a full-height layout whose heading is a compact horizontal
   * strip, which is what a document-list-first app wants.
   *
   * Three, because the three apps genuinely had three. Imposing one would have been a redesign
   * dressed as a refactor — what is worth sharing is the *content* and its order, not the frame.
   */
  readonly frame?: "page" | "card" | "bar";
  readonly className?: string;
}

const FRAMES = {
  page: {
    outer: "mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-8 py-10",
    header: "flex items-start gap-4",
    title: "text-[34px] font-semibold tracking-tight",
    body: "",
  },
  card: {
    outer:
      "mx-auto w-[min(760px,100%)] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]",
    header: "flex items-end justify-between gap-6 border-b border-[var(--hairline)] px-8 pt-8 pb-7",
    title: "text-[34px] font-semibold tracking-tight",
    body: "px-8 py-6",
  },
  bar: {
    outer: "flex h-screen flex-col bg-[var(--canvas)]",
    header: "flex items-center gap-3 border-b border-[var(--hairline)] px-8 py-5",
    title: "text-[15px] font-semibold tracking-tight",
    body: "flex-1 overflow-y-auto px-8 py-8",
  },
} as const;

export function Launch({
  mark,
  title,
  tagline,
  hint,
  actions,
  recentEmpty,
  recents = [],
  onOpenRecent,
  children,
  footer,
  notice,
  frame = "page",
  className,
}: LaunchProps) {
  const headingId = useId();
  const chrome = FRAMES[frame];
  const compact = frame === "bar";

  return (
    <div className={cx(chrome.outer, className)}>
      {notice}
      <header className={chrome.header}>
        {mark === undefined ? null : <div className="shrink-0">{mark}</div>}
        <div className="min-w-0">
          <h1 id={headingId} className={chrome.title}>
            {title}
          </h1>
          {/* In a compact bar the tagline is the second line of the header, so the rule and
              the hint would turn a 40px strip into a paragraph. */}
          {compact ? (
            <p className={cx("mt-0.5 text-[11px]", INK.muted)}>{hint ?? tagline}</p>
          ) : (
            <div className={cx("mt-1 max-w-[420px] text-[13px] leading-5", INK.muted)}>
              <p>{tagline}</p>
              {hint === undefined ? null : (
                <>
                  <hr className="my-2 border-[var(--hairline)]" />
                  <p>{hint}</p>
                </>
              )}
            </div>
          )}
        </div>
        {compact && actions !== undefined ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>

      <div className={cx(chrome.body, "flex flex-col gap-6")}>
        {compact || actions === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}

        {children}

        <section aria-labelledby={headingId} className="flex flex-col gap-2">
          {recents.length === 0
            ? recentEmpty
            : recents.map((recent) => (
                <div
                  key={recent.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--hairline)] px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => onOpenRecent?.(recent.id)}
                    className="flex min-w-0 flex-1 flex-col items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                  >
                    <span className="truncate text-[13px] font-medium">{recent.name}</span>
                    {recent.detail === undefined ? null : (
                      <span className={cx("text-[11px]", INK.muted)}>{recent.detail}</span>
                    )}
                  </button>
                  {recent.action}
                </div>
              ))}
        </section>
      </div>

      {footer === undefined ? null : (
        <footer
          className={cx(
            "mt-auto flex flex-wrap items-center gap-3 px-8 pb-6 text-[11px]",
            INK.faint,
          )}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}
