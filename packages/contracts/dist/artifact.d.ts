import { z } from "zod";
import { type ContractParse } from "./parse.js";
/**
 * `suite.artifact` — one signed, installable thing, described the same way wherever it came from.
 *
 * Two mechanisms in this suite already answer the same question. A desktop app ships an
 * electron-builder feed that names one AppImage and a detached ed25519 signature over that feed. A
 * mobile pack ships a manifest naming several files with a hash each, and a signature over the
 * manifest. Both pin a public key at build time. Both refuse an install that fails and keep the
 * working copy.
 *
 * Neither is wrong. What is wrong is that a reader has to hold two vocabularies to answer "is this
 * the artifact I think it is". This schema is the common sentence, not a replacement for either
 * format: nothing here is written to disk yet, and no installer reads it.
 *
 * ## What it deliberately does not carry
 *
 * **No executable path.** A manifest that names the binary to run lets a tampered manifest point
 * the launcher anywhere, which `suite.app` already refuses for the same reason. `entry` exists only
 * for a pack, where the entry is a module the host imports under its own policy rather than a
 * process it spawns.
 */
export declare const SUITE_ARTIFACT_FORMAT = "suite.artifact";
/**
 * The two kinds of thing this suite installs.
 *
 * `app` is a desktop application: one binary, installed once, updated in place.
 * `pack` is a mobile module: several files, installed and removed on demand.
 */
export declare const suiteArtifactKindSchema: z.ZodEnum<{
    app: "app";
    pack: "pack";
}>;
export declare const suiteArtifactFileSchema: z.ZodObject<{
    path: z.ZodString;
    sha256: z.ZodString;
    size: z.ZodNumber;
}, z.core.$strict>;
export declare const suiteArtifactSignatureSchema: z.ZodObject<{
    algorithm: z.ZodLiteral<"ed25519">;
    keyFingerprint: z.ZodString;
    value: z.ZodString;
}, z.core.$strict>;
export declare const suiteArtifactSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.artifact">;
    contractVersion: z.ZodString;
    kind: z.ZodEnum<{
        app: "app";
        pack: "pack";
    }>;
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    minimumHostVersion: z.ZodOptional<z.ZodString>;
    entry: z.ZodOptional<z.ZodString>;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        sha256: z.ZodString;
        size: z.ZodNumber;
    }, z.core.$strict>>;
    signature: z.ZodObject<{
        algorithm: z.ZodLiteral<"ed25519">;
        keyFingerprint: z.ZodString;
        value: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
export type SuiteArtifact = z.infer<typeof suiteArtifactSchema>;
export declare const parseSuiteArtifact: (input: unknown) => ContractParse<SuiteArtifact>;
/** The contract this module was written against. */
export declare const SUITE_ARTIFACT_CONTRACT_VERSION = "1.0.0";
/** True when this build can read that artifact document. */
export declare function isArtifactCompatible(contractVersion: string): boolean;
//# sourceMappingURL=artifact.d.ts.map