/** Run a schema and report every failure rather than the first. */
export function parseWith(schema, value) {
    const result = schema.safeParse(value);
    if (result.success)
        return { ok: true, value: result.data };
    return {
        ok: false,
        issues: result.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
        })),
    };
}
/** A short, human sentence for the first issue; for logs and error copy. */
export function describeIssues(issues) {
    const first = issues[0];
    if (!first)
        return "the document did not match the schema";
    return first.path.length > 0 ? `${first.path}: ${first.message}` : first.message;
}
//# sourceMappingURL=parse.js.map