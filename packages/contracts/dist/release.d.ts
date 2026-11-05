import { z } from "zod";
import type { ContractParse } from "./parse.js";
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
export declare const SUITE_RELEASE_CATALOG_FORMAT = "suite.release.catalog";
export declare const SUITE_RELEASE_CATALOG_FORMAT_VERSION = 1;
export declare const suiteReleaseArtifactSchema: z.ZodObject<{
    url: z.ZodURL;
    sha256: z.ZodString;
}, z.core.$strict>;
export declare const suiteReleaseEntrySchema: z.ZodObject<{
    app: z.ZodString;
    version: z.ZodString;
    channel: z.ZodDefault<z.ZodEnum<{
        stable: "stable";
        beta: "beta";
        alpha: "alpha";
    }>>;
    releasedAt: z.ZodOptional<z.ZodISODateTime>;
    artifact: z.ZodOptional<z.ZodObject<{
        url: z.ZodURL;
        sha256: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const suiteReleaseCatalogSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.release.catalog">;
    formatVersion: z.ZodLiteral<1>;
    generatedAt: z.ZodISODateTime;
    signature: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        app: z.ZodString;
        version: z.ZodString;
        channel: z.ZodDefault<z.ZodEnum<{
            stable: "stable";
            beta: "beta";
            alpha: "alpha";
        }>>;
        releasedAt: z.ZodOptional<z.ZodISODateTime>;
        artifact: z.ZodOptional<z.ZodObject<{
            url: z.ZodURL;
            sha256: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type SuiteReleaseArtifact = z.infer<typeof suiteReleaseArtifactSchema>;
export type SuiteReleaseEntry = z.infer<typeof suiteReleaseEntrySchema>;
export type SuiteReleaseCatalog = z.infer<typeof suiteReleaseCatalogSchema>;
/** How an installed version compares with what the catalog offers. */
export type CatalogState = "up-to-date" | "update-available" | "unknown";
export declare function parseReleaseCatalog(value: unknown): ContractParse<SuiteReleaseCatalog>;
/**
 * The newest entry for an app, on one channel when one is named.
 *
 * Ties cannot happen: the schema refuses two entries for the same app and
 * channel.
 */
export declare function findReleaseEntry(catalog: SuiteReleaseCatalog, appId: string, channel?: string): SuiteReleaseEntry | null;
/**
 * What the card says about updates.
 *
 * Three answers rather than two: a missing entry, an unreadable version or no
 * configured catalog is "unknown", and an unknown state must not read as
 * "up to date".
 */
export declare function catalogState(entry: Pick<SuiteReleaseEntry, "version"> | null | undefined, installedVersion: string): CatalogState;
//# sourceMappingURL=release.d.ts.map