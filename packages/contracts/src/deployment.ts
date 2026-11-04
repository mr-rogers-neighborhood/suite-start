import { z } from "zod";
import { suiteAppIdSchema } from "./appManifest.js";
import { type ContractParse, parseWith } from "./parse.js";

/**
 * `suite.deployment` — what a control plane says it is.
 *
 * This is the document that replaces a local "self-host" boolean. A flag in a
 * config file can be flipped and cannot be an entitlement boundary, so the flag
 * moves into a document the operator signs and the app verifies.
 *
 * It is still **not** an entitlement. It names endpoints and says which
 * deployment features exist; what an account may do is decided by the control
 * plane and the relay on every request. Tampering with a cached copy can point
 * an app at a different server, which then refuses it — it cannot grant a right.
 *
 * Local-only mode reads no document at all: an app with no control plane simply
 * does not sync.
 */
export const SUITE_DEPLOYMENT_FORMAT = "suite.deployment";
export const SUITE_DEPLOYMENT_FORMAT_VERSION = 1;

const webSocketUrlSchema = z
  .url()
  .refine(
    (value) => value.startsWith("wss://") || value.startsWith("ws://"),
    "a relay URL is ws:// or wss://",
  );

export const suiteDeploymentAuthSchema = z
  .object({
    issuer: z.url(),
    jwks: z.url(),
    clientId: z.string().min(1),
  })
  .strict();

/**
 * Deployment capabilities. `billing` says the operator runs a paid plan at all;
 * `selfHost` says this deployment is the operator's own rather than the hosted
 * one. Neither is a licence: a self-hosted control plane still mints and checks
 * entitlements, it just does not sell them.
 */
export const suiteDeploymentFeaturesSchema = z
  .object({
    billing: z.boolean().default(false),
    bundles: z.boolean().default(false),
    selfHost: z.boolean().default(false),
  })
  .strict();

export const suiteDeploymentSchema = z
  .object({
    format: z.literal(SUITE_DEPLOYMENT_FORMAT),
    formatVersion: z.literal(SUITE_DEPLOYMENT_FORMAT_VERSION),
    mode: z.enum(["hosted", "self-hosted"]),
    controlPlane: z.url(),
    auth: suiteDeploymentAuthSchema,
    /** Keyed by app id, so a fourth app needs no contract change. */
    relays: z.record(suiteAppIdSchema, webSocketUrlSchema).default({}),
    features: suiteDeploymentFeaturesSchema,
    catalog: z.url().optional(),
    issuedAt: z.iso.datetime(),
    /** Ed25519 over the document minus this field; the app pins the operator key. */
    signature: z.string().min(1).optional(),
  })
  .strict();

export type SuiteDeployment = z.infer<typeof suiteDeploymentSchema>;
export type SuiteDeploymentFeature = keyof SuiteDeployment["features"];

/** Parse a fetched deployment document without throwing. */
export function parseDeployment(value: unknown): ContractParse<SuiteDeployment> {
  return parseWith(suiteDeploymentSchema, value);
}

/** The relay an app should join, or null when this deployment runs none for it. */
export function relayFor(deployment: SuiteDeployment, appId: string): string | null {
  return deployment.relays[appId] ?? null;
}

/** Whether the deployment says the feature exists. Not an entitlement check. */
export function deploymentAllows(
  deployment: SuiteDeployment,
  feature: SuiteDeploymentFeature,
): boolean {
  return deployment.features[feature];
}

/** True when this deployment sells plans; a self-hosted one usually does not. */
export function sellsPlans(deployment: SuiteDeployment): boolean {
  return deployment.features.billing;
}
