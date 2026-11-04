import { z } from "zod";
import { CONTRACT_VERSION, isContractCompatible } from "./contractVersion.js";
import { type ContractParse, parseWith } from "./parse.js";

/**
 * `suite.app` — the manifest a signed app ships beside itself.
 *
 * The manifest deliberately carries **no executable path**. A file that names
 * the binary to run would let a stale or tampered manifest point the launcher at
 * anything; the install location belongs to Start's own registry entry, written
 * once at install time and checked against the signing identity there.
 */
export const SUITE_APP_MANIFEST_FORMAT = "suite.app";

/** Every deep link is under this prefix; an app's own is `suite://<id>/`. */
export const SUITE_PROTOCOL_PREFIX = "suite://";

const APP_ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;

/** Lower kebab-case. It is also the deep-link host, the manifest directory name and the relay key. */
export const suiteAppIdSchema = z
  .string()
  .regex(APP_ID_PATTERN, "an app id is lower kebab-case, 1-32 characters");

export const suiteSemverSchema = z.string().regex(SEMVER_PATTERN, "expected a semver version");

/**
 * What an app can do, stated positively so Start can say "this app is older than
 * the hub expects" instead of failing at a missing route.
 */
export const suiteCapabilitySchema = z.enum([
  "document.file",
  "document.bundle",
  "sync.relay",
  "attachments",
  "publish",
]);

export const suiteReleaseChannelSchema = z.enum(["stable", "beta", "alpha"]);

export const suiteAppUpdateSchema = z
  .object({
    /** Where the app's own updater reads its release feed. */
    feed: z.url(),
    channel: suiteReleaseChannelSchema.default("stable"),
  })
  .strict();

const fileExtensionSchema = z
  .string()
  .regex(/^[a-z0-9]{1,16}$/u, "a file extension is lower-case letters and digits, no dot");

const protocolSchema = z
  .string()
  .regex(/^[a-z][a-z0-9+.-]{0,39}$/u, "a protocol is a lower-case scheme, no colon");

function rejectDuplicates(
  values: readonly string[],
  path: string,
  context: {
    addIssue: (issue: { code: "custom"; path: (string | number)[]; message: string }) => void;
  },
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      context.addIssue({ code: "custom", path: [path], message: `duplicate value ${value}` });
      return;
    }
    seen.add(value);
  }
}

export const suiteAppManifestSchema = z
  .object({
    format: z.literal(SUITE_APP_MANIFEST_FORMAT),
    id: suiteAppIdSchema,
    name: z.string().min(1).max(64),
    version: suiteSemverSchema,
    /** The contract this build of the app was written against. */
    contractVersion: suiteSemverSchema.default(CONTRACT_VERSION),
    deepLinkPrefix: z.string().startsWith(SUITE_PROTOCOL_PREFIX),
    fileExtensions: z.array(fileExtensionSchema).max(16).default([]),
    protocols: z.array(protocolSchema).max(8).default([]),
    minHubVersion: suiteSemverSchema.optional(),
    update: suiteAppUpdateSchema.optional(),
    capabilities: z.array(suiteCapabilitySchema).max(16).default([]),
  })
  .strict()
  .superRefine((manifest, context) => {
    const expected = `${SUITE_PROTOCOL_PREFIX}${manifest.id}/`;
    if (manifest.deepLinkPrefix !== expected) {
      context.addIssue({
        code: "custom",
        path: ["deepLinkPrefix"],
        message: `must be ${expected}`,
      });
    }
    rejectDuplicates(manifest.fileExtensions, "fileExtensions", context);
    rejectDuplicates(manifest.protocols, "protocols", context);
    rejectDuplicates(manifest.capabilities, "capabilities", context);
  });

export type SuiteAppManifest = z.infer<typeof suiteAppManifestSchema>;
export type SuiteCapability = z.infer<typeof suiteCapabilitySchema>;
export type SuiteReleaseChannel = z.infer<typeof suiteReleaseChannelSchema>;

/** Parse a manifest read from disk without throwing; every failure is reported. */
export function parseAppManifest(value: unknown): ContractParse<SuiteAppManifest> {
  return parseWith(suiteAppManifestSchema, value);
}

/**
 * Whether this app can be launched by a hub implementing `hubContract`.
 *
 * Called in both directions: Start asks "can I route to this app?", and the app
 * asks "did Start hand me a link in a shape I understand?".
 */
export function manifestFitsHub(
  manifest: Pick<SuiteAppManifest, "contractVersion">,
  hubContract: string = CONTRACT_VERSION,
): boolean {
  return isContractCompatible(manifest.contractVersion, hubContract);
}

/** The deep link that opens this app with nothing selected. */
export function appEntryLink(manifest: Pick<SuiteAppManifest, "id">): string {
  return `${SUITE_PROTOCOL_PREFIX}${manifest.id}/`;
}
