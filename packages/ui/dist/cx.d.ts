/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `clsx`: this package is imported by four apps and a helper this small is
 * not worth a dependency. It does one thing — flatten the arguments, keep the truthy strings,
 * join them — and it does not do Tailwind conflict resolution, which is why a component's own
 * classes come first and a caller's `className` last.
 */
export type ClassValue = string | false | null | undefined | readonly ClassValue[] | Record<string, boolean | undefined>;
export declare function cx(...values: readonly ClassValue[]): string;
//# sourceMappingURL=cx.d.ts.map