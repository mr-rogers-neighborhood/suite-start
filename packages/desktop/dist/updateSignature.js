import { createHash, createPublicKey, verify } from "node:crypto";
/**
 * The publisher's update key, and the check that a manifest came from them.
 *
 * An update feed is one URL, and anything that can answer it can offer a version.
 * The artifact's `sha512` in the manifest protects against a corrupt download, not
 * against a manifest someone else wrote: an attacker who rewrites the file simply
 * rewrites the hash too. So the manifest is signed, and an app refuses one that
 * does not verify.
 *
 * The public half is here, in the source, because a public key is public. The
 * private half lives on the publisher's machine and in CI, and never in this
 * repository.
 */
export const SUITE_UPDATE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEACSihFH4Hjh0d4n8xncXd+VXMw6+MUDKTwbyVTI9UwFM=
-----END PUBLIC KEY-----
`;
/** The signature's file name beside a feed manifest. */
export const UPDATE_SIGNATURE_SUFFIX = ".sig";
/** A fingerprint a person can compare, so a key rotation is visible. */
export function updateKeyFingerprint() {
    const der = createPublicKey(SUITE_UPDATE_PUBLIC_KEY).export({ type: "spki", format: "der" });
    return createHash("sha256").update(der).digest("hex").slice(0, 32);
}
/**
 * True when the signature is this publisher's signature over these bytes.
 *
 * The signed thing is the manifest **exactly as served**, byte for byte. A
 * signature over a normalised copy would verify a file nobody was given.
 */
export function verifyUpdateManifest(manifest, signature, publicKey = SUITE_UPDATE_PUBLIC_KEY) {
    try {
        return verify(null, manifest, createPublicKey(publicKey), signature);
    }
    catch {
        return false;
    }
}
/** Base64, which is how the signature is published beside the manifest. */
export function decodeSignature(base64) {
    return new Uint8Array(Buffer.from(base64.trim(), "base64"));
}
//# sourceMappingURL=updateSignature.js.map