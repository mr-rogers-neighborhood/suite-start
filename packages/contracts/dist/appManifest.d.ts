import { z } from "zod";
import { type ContractParse } from "./parse.js";
/**
 * `suite.app` — the manifest a signed app ships beside itself.
 *
 * The manifest deliberately carries **no executable path**. A file that names
 * the binary to run would let a stale or tampered manifest point the launcher at
 * anything; the install location belongs to Start's own registry entry, written
 * once at install time and checked against the signing identity there.
 */
export declare const SUITE_APP_MANIFEST_FORMAT = "suite.app";
/** Every deep link is under this prefix; an app's own is `suite://<id>/`. */
export declare const SUITE_PROTOCOL_PREFIX = "suite://";
/** Lower kebab-case. It is also the deep-link host, the manifest directory name and the relay key. */
export declare const suiteAppIdSchema: z.ZodString;
export declare const suiteSemverSchema: z.ZodString;
/**
 * What an app can do, stated positively so Start can say "this app is older than
 * the hub expects" instead of failing at a missing route.
 */
export declare const suiteCapabilitySchema: z.ZodEnum<{
    "document.file": "document.file";
    "document.bundle": "document.bundle";
    "sync.relay": "sync.relay";
    attachments: "attachments";
    publish: "publish";
}>;
export declare const suiteReleaseChannelSchema: z.ZodEnum<{
    stable: "stable";
    beta: "beta";
    alpha: "alpha";
}>;
export declare const suiteAppUpdateSchema: z.ZodObject<{
    feed: z.ZodURL;
    channel: z.ZodDefault<z.ZodEnum<{
        stable: "stable";
        beta: "beta";
        alpha: "alpha";
    }>>;
}, z.core.$strict>;
export declare const suiteAppManifestSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.app">;
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    contractVersion: z.ZodDefault<z.ZodString>;
    deepLinkPrefix: z.ZodString;
    fileExtensions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    protocols: z.ZodDefault<z.ZodArray<z.ZodString>>;
    minHubVersion: z.ZodOptional<z.ZodString>;
    update: z.ZodOptional<z.ZodObject<{
        feed: z.ZodURL;
        channel: z.ZodDefault<z.ZodEnum<{
            stable: "stable";
            beta: "beta";
            alpha: "alpha";
        }>>;
    }, z.core.$strict>>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "document.file": "document.file";
        "document.bundle": "document.bundle";
        "sync.relay": "sync.relay";
        attachments: "attachments";
        publish: "publish";
    }>>>;
}, z.core.$strict>;
export type SuiteAppManifest = z.infer<typeof suiteAppManifestSchema>;
export type SuiteCapability = z.infer<typeof suiteCapabilitySchema>;
export type SuiteReleaseChannel = z.infer<typeof suiteReleaseChannelSchema>;
/** Parse a manifest read from disk without throwing; every failure is reported. */
export declare function parseAppManifest(value: unknown): ContractParse<SuiteAppManifest>;
/**
 * Whether this app can be launched by a hub implementing `hubContract`.
 *
 * Called in both directions: Start asks "can I route to this app?", and the app
 * asks "did Start hand me a link in a shape I understand?".
 */
export declare function manifestFitsHub(manifest: Pick<SuiteAppManifest, "contractVersion">, hubContract?: string): boolean;
/** The deep link that opens this app with nothing selected. */
export declare function appEntryLink(manifest: Pick<SuiteAppManifest, "id">): string;
//# sourceMappingURL=appManifest.d.ts.map