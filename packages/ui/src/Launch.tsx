import { type ReactNode, useId } from "react";
import { cx } from "./cx.js";
import { ImportMenu, type ImportOption } from "./ImportMenu.js";
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
   * Ways to bring material in from outside the app: an Obsidian vault, a bank export, a canvas
   * file from somewhere else.
   *
   * Kept apart from `actions` because it answers a different question. New and Open are about
   * the app's own documents; import is about someone else's. A person who has never imported
   * anything should be able to read the row and know which one never loses their data.
   *
   * One option renders as a plain button, so an app with a single import path does not have to
   * build a menu to say so.
   */
  readonly importOptions?: readonly ImportOption[];
  readonly className?: string;
}

/**
 * The frame, of which there is one.
 *
 * There were three, because Canvas, Budget and Planner had each drawn their own launcher and a
 * `frame` prop kept them from diverging further. That was the wrong shape for the goal: three
 * apps a person moves between should not ask them to re-learn the front door, and a prop that
 * exists so three screens can differ guarantees they will. The centred card won because it reads
 * as a place to start rather than as a toolbar above a list.
 */
const FRAME = {
  outer:
    "mx-auto w-[min(760px,100%)] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]",
  header: "flex items-end justify-between gap-6 border-b border-[var(--hairline)] px-8 pt-8 pb-7",
  title: "text-[34px] font-semibold tracking-tight",
  body: "px-8 py-6",
} as const;

export function Launch({
  mark,
  title,
  tagline,
  hint,
  actions,
  importOptions,
  recentEmpty,
  recents = [],
  onOpenRecent,
  children,
  footer,
  notice,
  className,
}: LaunchProps) {
  const headingId = useId();
  const chrome = FRAME;

  return (
    <div className={cx(chrome.outer, className)}>
      {notice}
      <header className={chrome.header}>
        {mark === undefined ? null : <div className="shrink-0">{mark}</div>}
        <div className="min-w-0">
          <h1 id={headingId} className={chrome.title}>
            {title}
          </h1>
          <div className={cx("mt-1 max-w-[420px] text-[13px] leading-5", INK.muted)}>
            <p>{tagline}</p>
            {hint === undefined ? null : (
              <>
                <hr className="my-2 border-[var(--hairline)]" />
                <p>{hint}</p>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={cx(chrome.body, "flex flex-col gap-6")}>
        {actions === undefined && importOptions === undefined ? null : (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {importOptions === undefined ? null : <ImportMenu options={importOptions} />}
          </div>
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
