import type { ReactNode } from "react";
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
export declare function AppMark({ viewBox, paths, label, size, className, }: AppMarkProps): ReactNode;
//# sourceMappingURL=AppMark.d.ts.map