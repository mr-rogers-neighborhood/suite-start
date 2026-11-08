import type { ReactNode } from "react";
import { cx } from "./cx.js";

/**
 * An app's own mark: its glyph on a tile, both painted from the theme.
 *
 * Every app in the suite already ships its glyph for the window and menu icon, and none of them
 * used it inside the app. Two wore a CSS gradient square instead and one wore the Suite logo —
 * because a glyph drawn `fill="#fff"` is invisible on a light background, so a single file cannot
 * serve both modes and something had to stand in.
 *
 * The answer is the answer to every other colour question here: `currentColor` on a themed paint.
 * The tile carries `--accent`, the glyph carries `--on-accent`, and the preset gate already holds
 * that pair to 4.5:1 in every theme and both modes. One component, every preset, no `dark:` pairs,
 * no per-theme files.
 *
 * The glyph stays with the app because it *is* the app's identity: the shape distinguishes Canvas
 * from Budget, and the colour says they belong to one suite.
 */
export type AppMarkSize = "sm" | "md" | "lg";

export interface AppMarkProps {
  /** The glyph's own coordinate space. Each app's artwork was drawn at its own size. */
  readonly viewBox: string;
  /** One or more path `d` strings. Multiple, because some glyphs are several shapes. */
  readonly paths: readonly string[];
  /**
   * The accessible name. Omitted, the mark is decoration — which is right when the app's name is
   * written beside it, the usual case.
   */
  readonly label?: string;
  readonly size?: AppMarkSize;
  /** Lets a caller size the tile independently, for a launcher's heading. */
  readonly className?: string;
}

const SIZES: Record<AppMarkSize, { tile: string; inset: string }> = {
  sm: { tile: "h-6 w-6 rounded-[8px]", inset: "h-4 w-4" },
  md: { tile: "h-7 w-7 rounded-[9px]", inset: "h-[18px] w-[18px]" },
  lg: { tile: "h-12 w-12 rounded-2xl", inset: "h-7 w-7" },
};

export function AppMark({
  viewBox,
  paths,
  label,
  size = "md",
  className,
}: AppMarkProps): ReactNode {
  const { tile, inset } = SIZES[size];
  const named = label !== undefined;

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center",
        tile,
        // The tile is the paint; the glyph inherits what the theme says is readable on it.
        "bg-[var(--accent)] text-[var(--on-accent)]",
        className,
      )}
      // A decorative mark must not be announced twice, since the name is beside it.
      {...(named ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/* The tile is the accessible element: it carries `role="img"` and the name, so the
          drawing inside is decoration. A `<title>` here as well would be announced twice. */}
      <svg
        viewBox={viewBox}
        className={inset}
        fill="currentColor"
        focusable="false"
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}
