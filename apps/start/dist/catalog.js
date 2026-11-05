import { describeIssues, parseReleaseCatalog } from "@suite/contracts";
/** The path named by `SUITE_START_CATALOG`, or null when none is named. */
export function catalogPathFromEnv(env = process.env) {
    const named = env.SUITE_START_CATALOG?.trim();
    return named !== undefined && named.length > 0 ? named : null;
}
export async function readCatalog(path, fileSystem) {
    if (path === null)
        return { state: "none" };
    let text;
    try {
        text = await fileSystem.readText(path);
    }
    catch {
        return { state: "refused", path, reason: "the catalog file could not be read" };
    }
    let value;
    try {
        value = JSON.parse(text);
    }
    catch {
        return { state: "refused", path, reason: "the catalog is not JSON" };
    }
    const parsed = parseReleaseCatalog(value);
    if (!parsed.ok)
        return { state: "refused", path, reason: describeIssues(parsed.issues) };
    return { state: "configured", path, catalog: parsed.value };
}
//# sourceMappingURL=catalog.js.map