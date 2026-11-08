/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `clsx`: this package is imported by four apps and a helper this small is
 * not worth a dependency. It does one thing — flatten the arguments, keep the truthy strings,
 * join them — and it does not do Tailwind conflict resolution, which is why a component's own
 * classes come first and a caller's `className` last.
 */
export type ClassValue =
  | string
  | false
  | null
  | undefined
  | readonly ClassValue[]
  | Record<string, boolean | undefined>;

export function cx(...values: readonly ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (value === false || value === null || value === undefined) continue;
    if (typeof value === "string") {
      if (value.length > 0) out.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      const nested = cx(...(value as readonly ClassValue[]));
      if (nested.length > 0) out.push(nested);
      continue;
    }
    for (const [key, on] of Object.entries(value)) if (on === true) out.push(key);
  }
  return out.join(" ");
}
