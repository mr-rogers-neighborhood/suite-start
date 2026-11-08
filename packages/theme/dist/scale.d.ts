import type { Paintable } from "./apply.js";
/**
 * Type sizes and control density, named.
 *
 * These are the second axis of the theme, after colour. Colour roles say what a thing *is*;
 * these say how big it is and how much room it gets.
 *
 * ## Why the values look like the ones they replaced
 *
 * The primitives used five unrelated pixel sizes and two control heights, and the obvious move
 * is a tidy scale with fewer steps. That is not this. Every value here reproduces what shipped,
 * because a type scale that arrives with a redesign is two changes wearing one coat: nobody can
 * tell afterwards which difference was the tidying and which was the accident.
 *
 * So `caption` is 11px because footers were 11px, and `label` is 12px because selects were 12px.
 * Consolidating 12 into 13 is worth doing once somebody can look at it and decide, and that is a
 * separate change from naming the values we already had.
 *
 * ## Density is not type
 *
 * Density changes room — control heights, padding, gaps — and never font size. A phone that
 * raises the system font scale *and* a density that raises type would multiply, and 1.3 scale at
 * an already-large type size is a layout nobody measured. The system owns type size; this owns
 * space.
 */
export declare const TYPE_ROLES: readonly ["caption", "label", "body", "title", "display"];
export type TypeRole = (typeof TYPE_ROLES)[number];
export interface TypeStep {
    readonly size: string;
    readonly lineHeight: string;
}
/** The sizes that shipped, with line heights that were previously implicit. */
export declare const TYPE_SCALE: Readonly<Record<TypeRole, TypeStep>>;
/**
 * The density names, which are not ours.
 *
 * `@suite/go` already publishes `ThemeDensity` with these three values in `ModuleHost`, so
 * reusing them means neither side has to translate. A fourth name would have been a fork with
 * extra steps.
 */
export declare const DENSITIES: readonly ["compact", "cozy", "comfortable"];
export type Density = (typeof DENSITIES)[number];
export interface DensityMetrics {
    /** A full-size control: a primary button, a field. */
    readonly controlHeight: string;
    /** The small variant. */
    readonly controlHeightSmall: string;
    readonly controlPaddingX: string;
    readonly controlPaddingXSmall: string;
    readonly controlGap: string;
    readonly controlGapSmall: string;
    /** Vertical padding of a list row, such as a recent document. */
    readonly rowPaddingY: string;
}
/**
 * `cozy` is what shipped, exactly: a 36px button with 12px of side padding.
 *
 * That is the default, so adopting these tokens changes no desktop pixel. `comfortable` is the
 * one a touch host picks, and its 44px control height is the number mobile accessibility asks
 * for rather than a taste.
 */
export declare const DENSITY_SCALE: Readonly<Record<Density, DensityMetrics>>;
export declare const DEFAULT_DENSITY: Density;
/** The custom property a type step publishes, and its line height. */
export declare function typeVariableFor(role: TypeRole): {
    size: string;
    lineHeight: string;
};
/** Every type step as custom properties. */
export declare function typeVariables(): Readonly<Record<string, string>>;
/** Every density metric as a custom property. */
export declare function densityVariables(density: Density): Readonly<Record<string, string>>;
/**
 * Publish the type and density variables on an element.
 *
 * Separate from `applyTheme` rather than folded into it, because the two answer different
 * questions and a call site may reasonably want a theme without touching density. Every
 * primitive reads these with a fallback equal to what shipped, so a document that never calls
 * this renders exactly as it did.
 */
export declare function applyScale(density: Density, target: Paintable): void;
//# sourceMappingURL=scale.d.ts.map