import { z } from "zod";
import { suiteAppIdSchema, suiteReleaseChannelSchema, suiteSemverSchema } from "./appManifest.js";
import { compareSemver, parseSemver } from "./contractVersion.js";
import { parseWith } from "./parse.js";
/**
 * `suite.release.catalog` — what exists, as a file.
 *
 * The catalog is read from a path the operator names and is **never fetched** by
 * this build: there is no release feed yet, and a verification path exercised
 * only by tests would be worse than an honest "no catalog configured".
 *
 * `signature` is carried and not checked here. Verifying it needs a key this
 * build does not ship, so pretending to check it would be the same lie as
 * fetching something that does not exist. What the reader can do is refuse a
 * catalog whose shape is wrong, by field name.
 *
 * An entry describes a release; it does not install one. "Update available"
 * stays a state until an app publishes a signed artifact.
 */
export const SUITE_RELEASE_CATALOG_FORMAT = "suite.release.catalog";
export const SUITE_RELEASE_CATALOG_FORMAT_VERSION = 1;
export const suiteReleaseArtifactSchema = z
    .object({
    url: z.url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u, "a sha256 is 64 lower-case hex characters"),
})
    .strict();
export const suiteReleaseEntrySchema = z
    .object({
    app: suiteAppIdSchema,
    version: suiteSemverSchema,
    channel: suiteReleaseChannelSchema.default("stable"),
    /** When the release was published; absent while a catalog is hand-written. */
    releasedAt: z.iso.datetime().optional(),
    /** Present once a signed artifact exists. A state needs none of these. */
    artifact: suiteReleaseArtifactSchema.optional(),
})
    .strict();
export const suiteReleaseCatalogSchema = z
    .object({
    format: z.literal(SUITE_RELEASE_CATALOG_FORMAT),
    formatVersion: z.literal(SUITE_RELEASE_CATALOG_FORMAT_VERSION),
    generatedAt: z.iso.datetime(),
    /** Carried, never verified by this build. */
    signature: z.string().min(1),
    entries: z.array(suiteReleaseEntrySchema).max(64),
})
    .strict()
    .superRefine((catalog, context) => {
    const seen = new Set();
    for (const entry of catalog.entries) {
        const key = `${entry.app}/${entry.channel}`;
        if (seen.has(key)) {
            context.addIssue({
                code: "custom",
                path: ["entries"],
                message: `two releases of ${entry.app} on the ${entry.channel} channel`,
            });
            return;
        }
        seen.add(key);
    }
});
export function parseReleaseCatalog(value) {
    return parseWith(suiteReleaseCatalogSchema, value);
}
/**
 * The newest entry for an app, on one channel when one is named.
 *
 * Ties cannot happen: the schema refuses two entries for the same app and
 * channel.
 */
export function findReleaseEntry(catalog, appId, channel) {
    let found = null;
    for (const entry of catalog.entries) {
        if (entry.app !== appId)
            continue;
        if (channel !== undefined && entry.channel !== channel)
            continue;
        if (found === null) {
            found = entry;
            continue;
        }
        const candidate = parseSemver(entry.version);
        const best = parseSemver(found.version);
        if (candidate !== null && best !== null && compareSemver(candidate, best) > 0)
            found = entry;
    }
    return found;
}
/**
 * What the card says about updates.
 *
 * Three answers rather than two: a missing entry, an unreadable version or no
 * configured catalog is "unknown", and an unknown state must not read as
 * "up to date".
 */
export function catalogState(entry, installedVersion) {
    if (!entry)
        return "unknown";
    const offered = parseSemver(entry.version);
    const installed = parseSemver(installedVersion);
    if (offered === null || installed === null)
        return "unknown";
    return compareSemver(offered, installed) > 0 ? "update-available" : "up-to-date";
}
//# sourceMappingURL=release.js.map