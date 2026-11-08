/**
 * "Open this one, don't ask me."
 *
 * A person with one canvas, one planner and one budget does not want a launcher: they want the
 * thing they always open. This is the piece that lets a launcher get out of the way, and the
 * piece that has to be careful about it — a default that silently failed to open would leave
 * them staring at nothing, which is worse than a launcher.
 *
 * Deliberately pure: the app hands in what it stored and whether that file is still there, and
 * gets back a decision plus what to say. The storage and the filesystem stay with the app.
 */
export interface DefaultRecord {
  /** Whatever the app calls a workspace: an id, or a path. */
  readonly id: string;
  /** What to show if the file has gone missing. */
  readonly name: string;
}

export type DefaultResolution =
  | { readonly kind: "none" }
  | { readonly kind: "open"; readonly id: string }
  /** The default was set, but the file it names is not there any more. */
  | { readonly kind: "missing"; readonly name: string };

/** Forgiving read: anything that is not `{ id, name }` is "no default". */
export function readDefault(raw: unknown): DefaultRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as { id?: unknown; name?: unknown };
  if (typeof record.id !== "string" || record.id.length === 0) return null;
  return { id: record.id, name: typeof record.name === "string" ? record.name : record.id };
}

/**
 * What to do with a stored default.
 *
 * `exists` is injected so this is a rule with a test rather than a disk read, and so an app can
 * answer from what it already knows — the launcher has just listed the library anyway.
 */
export function resolveDefault(
  record: DefaultRecord | null,
  exists: (id: string) => boolean,
): DefaultResolution {
  if (record === null) return { kind: "none" };
  return exists(record.id)
    ? { kind: "open", id: record.id }
    : { kind: "missing", name: record.name };
}

/**
 * The sentence a launcher shows when its default has gone.
 *
 * Naming the thing matters: "your default is missing" is a state to diagnose, and
 * "<name> is not where it was" is one to understand.
 */
export function missingDefaultSentence(name: string): string {
  return `${name} is not where it was, so this is the list instead. Pick another with "Open".`;
}
