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
export declare const SUITE_UPDATE_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEACSihFH4Hjh0d4n8xncXd+VXMw6+MUDKTwbyVTI9UwFM=\n-----END PUBLIC KEY-----\n";
/** The signature's file name beside a feed manifest. */
export declare const UPDATE_SIGNATURE_SUFFIX = ".sig";
/** A fingerprint a person can compare, so a key rotation is visible. */
export declare function updateKeyFingerprint(): string;
/**
 * True when the signature is this publisher's signature over these bytes.
 *
 * The signed thing is the manifest **exactly as served**, byte for byte. A
 * signature over a normalised copy would verify a file nobody was given.
 */
export declare function verifyUpdateManifest(manifest: Uint8Array, signature: Uint8Array, publicKey?: string): boolean;
/** Base64, which is how the signature is published beside the manifest. */
export declare function decodeSignature(base64: string): Uint8Array;
//# sourceMappingURL=updateSignature.d.ts.map