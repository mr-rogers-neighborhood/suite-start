import { describe, expect, it } from "vitest";
import { deploymentAllows, parseDeployment, relayFor, sellsPlans } from "./deployment.js";
import { describeIssues } from "./parse.js";

const hosted = {
  format: "suite.deployment",
  formatVersion: 1,
  mode: "hosted",
  controlPlane: "https://start.suite.run",
  auth: {
    issuer: "https://start.suite.run",
    jwks: "https://start.suite.run/api/auth/jwks",
    clientId: "suite-desktop",
  },
  relays: {
    canvas: "wss://relay.suite.run/canvas",
    planner: "wss://relay.suite.run/planner",
    budget: "wss://relay.suite.run/budget",
  },
  features: { billing: true, bundles: true, selfHost: false },
  catalog: "https://releases.suite.run/catalog.json",
  issuedAt: "2026-11-04T20:00:00.000Z",
  signature: "ed25519:abc",
};

function loaded(document: unknown) {
  const parsed = parseDeployment(document);
  if (!parsed.ok) throw new Error(describeIssues(parsed.issues));
  return parsed.value;
}

describe("parseDeployment", () => {
  it("accepts a hosted document", () => {
    expect(loaded(hosted).mode).toBe("hosted");
  });

  it("accepts a self-hosted document that sells nothing", () => {
    const document = {
      ...hosted,
      mode: "self-hosted",
      controlPlane: "https://suite.internal",
      features: { billing: false, bundles: false, selfHost: true },
      signature: undefined,
    };
    const deployment = loaded(document);
    expect(sellsPlans(deployment)).toBe(false);
    expect(deploymentAllows(deployment, "selfHost")).toBe(true);
  });

  it("fills features that an older document omits", () => {
    const deployment = loaded({ ...hosted, features: {} });
    expect(deployment.features).toEqual({ billing: false, bundles: false, selfHost: false });
  });

  it("refuses a relay that is not a websocket URL", () => {
    const parsed = parseDeployment({
      ...hosted,
      relays: { canvas: "https://relay.suite.run/canvas" },
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(describeIssues(parsed.issues)).toContain("ws://");
  });

  it("refuses a relay keyed by something that is not an app id", () => {
    expect(parseDeployment({ ...hosted, relays: { "Not An App": "wss://relay/x" } }).ok).toBe(
      false,
    );
  });

  it("refuses a future format version rather than guessing", () => {
    expect(parseDeployment({ ...hosted, formatVersion: 2 }).ok).toBe(false);
  });

  it("refuses a document missing the JWKS the relay verifies against", () => {
    expect(parseDeployment({ ...hosted, auth: { issuer: "https://start.suite.run" } }).ok).toBe(
      false,
    );
  });
});

describe("relayFor", () => {
  it("finds the app's relay", () => {
    expect(relayFor(loaded(hosted), "canvas")).toBe("wss://relay.suite.run/canvas");
  });

  it("answers null for an app this deployment does not sync", () => {
    expect(relayFor(loaded({ ...hosted, relays: {} }), "canvas")).toBeNull();
  });
});
