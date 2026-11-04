import { z } from "zod";
import { type ContractParse } from "./parse.js";
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
export declare const SUITE_DEPLOYMENT_FORMAT = "suite.deployment";
export declare const SUITE_DEPLOYMENT_FORMAT_VERSION = 1;
export declare const suiteDeploymentAuthSchema: z.ZodObject<{
    issuer: z.ZodURL;
    jwks: z.ZodURL;
    clientId: z.ZodString;
}, z.core.$strict>;
/**
 * Deployment capabilities. `billing` says the operator runs a paid plan at all;
 * `selfHost` says this deployment is the operator's own rather than the hosted
 * one. Neither is a licence: a self-hosted control plane still mints and checks
 * entitlements, it just does not sell them.
 */
export declare const suiteDeploymentFeaturesSchema: z.ZodObject<{
    billing: z.ZodDefault<z.ZodBoolean>;
    bundles: z.ZodDefault<z.ZodBoolean>;
    selfHost: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const suiteDeploymentSchema: z.ZodObject<{
    format: z.ZodLiteral<"suite.deployment">;
    formatVersion: z.ZodLiteral<1>;
    mode: z.ZodEnum<{
        hosted: "hosted";
        "self-hosted": "self-hosted";
    }>;
    controlPlane: z.ZodURL;
    auth: z.ZodObject<{
        issuer: z.ZodURL;
        jwks: z.ZodURL;
        clientId: z.ZodString;
    }, z.core.$strict>;
    relays: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodURL>>;
    features: z.ZodObject<{
        billing: z.ZodDefault<z.ZodBoolean>;
        bundles: z.ZodDefault<z.ZodBoolean>;
        selfHost: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>;
    catalog: z.ZodOptional<z.ZodURL>;
    issuedAt: z.ZodISODateTime;
    signature: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type SuiteDeployment = z.infer<typeof suiteDeploymentSchema>;
export type SuiteDeploymentFeature = keyof SuiteDeployment["features"];
/** Parse a fetched deployment document without throwing. */
export declare function parseDeployment(value: unknown): ContractParse<SuiteDeployment>;
/** The relay an app should join, or null when this deployment runs none for it. */
export declare function relayFor(deployment: SuiteDeployment, appId: string): string | null;
/** Whether the deployment says the feature exists. Not an entitlement check. */
export declare function deploymentAllows(deployment: SuiteDeployment, feature: SuiteDeploymentFeature): boolean;
/** True when this deployment sells plans; a self-hosted one usually does not. */
export declare function sellsPlans(deployment: SuiteDeployment): boolean;
//# sourceMappingURL=deployment.d.ts.map