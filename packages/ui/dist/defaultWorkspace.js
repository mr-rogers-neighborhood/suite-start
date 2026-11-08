/** Forgiving read: anything that is not `{ id, name }` is "no default". */
export function readDefault(raw) {
    if (typeof raw !== "object" || raw === null)
        return null;
    const record = raw;
    if (typeof record.id !== "string" || record.id.length === 0)
        return null;
    return { id: record.id, name: typeof record.name === "string" ? record.name : record.id };
}
/**
 * What to do with a stored default.
 *
 * `exists` is injected so this is a rule with a test rather than a disk read, and so an app can
 * answer from what it already knows — the launcher has just listed the library anyway.
 */
export function resolveDefault(record, exists) {
    if (record === null)
        return { kind: "none" };
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
export function missingDefaultSentence(name) {
    return `${name} is not where it was, so this is the list instead. Pick another with "Open".`;
}
//# sourceMappingURL=defaultWorkspace.js.map