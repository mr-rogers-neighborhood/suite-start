import { z } from "zod";
import { CONTRACT_VERSION, isContractCompatible } from "./contractVersion.js";
import { parseWith } from "./parse.js";
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
export const SUITE_ARTIFACT_FORMAT = "suite.artifact";
/**
 * The two kinds of thing this suite installs.
 *
 * `app` is a desktop application: one binary, installed once, updated in place.
 * `pack` is a mobile module: several files, installed and removed on demand.
 */
export const suiteArtifactKindSchema = z.enum(["app", "pack"]);
const ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
export const suiteArtifactFileSchema = z
    .object({
    /** Relative to the artifact root. Never absolute, never containing `..`. */
    path: z
        .string()
        .min(1)
        .refine((value) => !value.startsWith("/") && !value.split("/").includes(".."), {
        message: "an artifact path is relative and cannot climb out of the artifact",
    }),
    sha256: z.string().regex(SHA256_PATTERN, "expected a lower-case hex sha256"),
    size: z.number().int().nonnegative(),
})
    .strict();
export const suiteArtifactSignatureSchema = z
    .object({
    /** One algorithm, named so a future one is a visible change rather than a guess. */
    algorithm: z.literal("ed25519"),
    /** The first 32 hex characters of sha256 over the public key, as the desktop updater publishes it. */
    keyFingerprint: z.string().regex(/^[0-9a-f]{32}$/u, "expected 32 hex characters"),
    /** Base64, detached, over the canonical bytes of this document with the signature removed. */
    value: z.string().min(1),
})
    .strict();
export const suiteArtifactSchema = z
    .object({
    format: z.literal(SUITE_ARTIFACT_FORMAT),
    /** Which contract this document was written against, so an old reader can refuse cleanly. */
    contractVersion: z.string().regex(SEMVER_PATTERN),
    kind: suiteArtifactKindSchema,
    /** Lower kebab-case. The same id space as an app id, a manifest directory and a relay key. */
    id: z.string().regex(ID_PATTERN, "an artifact id is lower kebab-case, 1-32 characters"),
    name: z.string().min(1),
    version: z.string().regex(SEMVER_PATTERN),
    /**
     * The oldest host that can run this. Absent means "any host that can read this document".
     *
     * A pack needs it because the host provides the APIs a module calls. An app does not, because
     * it ships its own runtime.
     */
    minimumHostVersion: z.string().regex(SEMVER_PATTERN).optional(),
    /** Present only for a pack: the module the host imports. Never a path to spawn. */
    entry: z.string().min(1).optional(),
    /** Every file the artifact consists of. An app has one; a pack has many. */
    files: z.array(suiteArtifactFileSchema).min(1),
    signature: suiteArtifactSignatureSchema,
})
    .strict()
    .refine((value) => value.kind !== "pack" || value.entry !== undefined, {
    message: "a pack declares its entry module",
    path: ["entry"],
})
    .refine((value) => value.kind !== "app" || value.entry === undefined, {
    message: "an app names no entry: the install location belongs to the host's registry",
    path: ["entry"],
})
    .refine((value) => new Set(value.files.map((file) => file.path)).size === value.files.length, {
    message: "two files share a path",
    path: ["files"],
});
export const parseSuiteArtifact = (input) => parseWith(suiteArtifactSchema, input);
/** The contract this module was written against. */
export const SUITE_ARTIFACT_CONTRACT_VERSION = CONTRACT_VERSION;
/** True when this build can read that artifact document. */
export function isArtifactCompatible(contractVersion) {
    return isContractCompatible(contractVersion);
}
//# sourceMappingURL=artifact.js.map