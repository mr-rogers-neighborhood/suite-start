import {
  decodeSignature,
  SUITE_UPDATE_PUBLIC_KEY,
  UPDATE_SIGNATURE_SUFFIX,
  verifyUpdateManifest,
} from "./updateSignature.js";

/**
 * Reading a signed release feed.
 *
 * One implementation for the hub and for the apps, because they must agree about
 * what is newest: the hub reads the file to show a version, and the app reads it to
 * decide whether to update itself. A second parser is a second opinion.
 *
 * Nothing here writes, downloads an artifact or replaces anything.
 */

/** The file `electron-updater` looks for, by platform. */
export function feedFileFor(platform: string): string {
  if (platform === "darwin") return "latest-mac.yml";
  if (platform === "win32") return "latest.yml";
  return "latest-linux.yml";
}

/**
 * The version a feed file names.
 *
 * The file is YAML, and a caller needs one scalar from it. Parsing the document
 * would be a dependency for a line `electron-updater` writes as `version: 0.5.0` at
 * the top level; this reads exactly that and returns null rather than guessing.
 */
export function versionFromFeed(text: string): string | null {
  for (const line of text.split(/\r?\n/u)) {
    const match = /^version:\s*(.+?)\s*$/u.exec(line);
    if (match?.[1] !== undefined) {
      const value = match[1].replace(/^["']|["']$/gu, "");
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

/** The feed's base URL, as `electron-updater` records it beside a packaged app. */
export function feedUrlFromAppUpdateYml(text: string): string | null {
  for (const line of text.split(/\r?\n/u)) {
    const match = /^url:\s*(.+?)\s*$/u.exec(line);
    if (match?.[1] !== undefined) {
      const value = match[1].replace(/^["']|["']$/gu, "");
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

/** The file a feed offers, as the manifest names it. */
export interface FeedArtifact {
  /**
   * The file's name as published.
   *
   * Never a path: a feed names one file beside itself, and a name carrying a
   * separator or a traversal would be a feed trying to write somewhere else. A
   * value like that is refused rather than resolved.
   */
  readonly path: string;
  /** Base64 SHA-512 of the file's bytes, exactly as `electron-builder` writes it. */
  readonly sha512: string;
  /** Bytes, for a progress bar. Null when the feed did not say. */
  readonly size: number | null;
}

interface FilesEntry {
  url: string;
  sha512: string | null;
  size: number | null;
}

const UNSAFE_FILENAME = /[\\/\0]/u;

function scalar(value: string): string {
  return value.replace(/^["']|["']$/gu, "").trim();
}

function field(line: string): { key: string; value: string } | null {
  const match = /^\s*(?:-\s+)?([A-Za-z][\w-]*):\s*(.*)$/u.exec(line);
  if (match?.[1] === undefined) return null;
  return { key: match[1], value: scalar(match[2] ?? "") };
}

/** The `files:` block and the top-level `path:`/`sha512:`, as a plain read of the shape. */
function readFeedFiles(text: string): {
  entries: readonly FilesEntry[];
  path: string | null;
  sha512: string | null;
} {
  const entries: FilesEntry[] = [];
  let path: string | null = null;
  let sha512: string | null = null;
  let inFiles = false;

  for (const line of text.split(/\r?\n/u)) {
    // An unindented line is a top-level key, and the first one after `files:`
    // ends the block.
    if (/^\S/u.test(line)) {
      const top = field(line);
      inFiles = top?.key === "files" && top.value.length === 0;
      if (top?.key === "path" && top.value.length > 0) path = top.value;
      if (top?.key === "sha512" && top.value.length > 0) sha512 = top.value;
      continue;
    }
    if (!inFiles) continue;

    const isNewItem = /^\s*-\s+/u.test(line);
    if (isNewItem) entries.push({ url: "", sha512: null, size: null });
    const current = entries.at(-1);
    if (current === undefined) continue;

    const found = field(line);
    if (found?.key === "url") current.url = found.value;
    else if (found?.key === "sha512") current.sha512 = found.value;
    else if (found?.key === "size") {
      const bytes = Number.parseInt(found.value, 10);
      current.size = Number.isFinite(bytes) ? bytes : null;
    }
  }

  return { entries, path, sha512 };
}

/**
 * The artifact a feed offers: the file an install would download.
 *
 * `electron-builder` writes the artifact twice — once in `files:` with its size,
 * and once as the top-level `path:`/`sha512:` pair — and a feed may list more than
 * one entry (a `.blockmap` rides along for some targets). The top-level pair is the
 * primary file, so it wins; the block map never does. Returning null rather than
 * guessing is the same rule `versionFromFeed` follows: a caller installs what the
 * manifest named, or it installs nothing.
 */
export function artifactFromFeed(text: string): FeedArtifact | null {
  const { entries, path: declared, sha512: declaredSha } = readFeedFiles(text);
  const declaredEntry =
    declared === null ? undefined : entries.find((entry) => entry.url === declared);
  const chosen =
    declaredEntry ?? entries.find((entry) => !entry.url.endsWith(".blockmap")) ?? entries[0];

  const path = declared ?? chosen?.url ?? null;
  const sha512 = declaredSha ?? chosen?.sha512 ?? null;
  if (path === null || sha512 === null) return null;
  if (path === "." || path === ".." || path.endsWith(".blockmap")) return null;
  if (UNSAFE_FILENAME.test(path)) return null;

  return { path, sha512, size: chosen?.size ?? null };
}

export interface FeedResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
}

export type FeedFetch = (url: string) => Promise<FeedResponse>;

export interface FeedCheck {
  /** The version the feed offers, or null when it could not be read or did not verify. */
  readonly version: string | null;
  /** Why it is null, in words a surface can show. */
  readonly reason: string | null;
  /** When this check ran, ISO-8601. */
  readonly checkedAt: string;
  /** True only when a signature over the served bytes verified. */
  readonly verified: boolean;
  /**
   * The artifact the **verified** manifest names, when it named one.
   *
   * Parsed from the same bytes the signature covered, so an install never fetches
   * the manifest twice and can never compare a download against a second, unverified
   * copy of what was asked for. Null when the manifest named no artifact.
   */
  readonly artifact: FeedArtifact | null;
}

/**
 * Read one app's feed, and refuse a manifest the publisher did not sign.
 *
 * The signature is over the manifest **exactly as served**: normalising it first
 * would verify a file nobody was given. A feed that answers, but with an unsigned or
 * tampered manifest, is the case this exists for, so it is reported rather than
 * treated as "no update".
 *
 * This is also the only place a product build reads the network on behalf of an app.
 * The app hands in a feed and receives an answer; it never holds the capability
 * itself, which is what lets an app repository assert that its own code makes no
 * network calls.
 */
export async function checkSignedFeed(
  feed: string,
  platform: string,
  fetchFeed?: FeedFetch,
  now: () => Date = () => new Date(),
  /** Overridable so a test can prove the accepting path without the publisher's key. */
  publicKey: string = SUITE_UPDATE_PUBLIC_KEY,
): Promise<FeedCheck> {
  const fetch: FeedFetch = fetchFeed ?? ((url: string) => globalThis.fetch(url));
  const checkedAt = now().toISOString();
  const base = feed.replace(/\/+$/u, "");
  const file = feedFileFor(platform);
  const fail = (reason: string): FeedCheck => ({
    version: null,
    reason,
    checkedAt,
    verified: false,
    artifact: null,
  });

  try {
    const manifest = await fetch(`${base}/${file}`);
    if (!manifest.ok) return fail(`the feed answered ${manifest.status}`);

    const signatureResponse = await fetch(`${base}/${file}${UPDATE_SIGNATURE_SUFFIX}`);
    if (!signatureResponse.ok) {
      return fail("the feed published no signature, so the manifest cannot be trusted");
    }

    const body = await manifest.text();
    const signature = decodeSignature(await signatureResponse.text());
    if (!verifyUpdateManifest(new TextEncoder().encode(body), signature, publicKey)) {
      return fail("the manifest is not signed by the publisher");
    }

    const version = versionFromFeed(body);
    if (version === null) return fail("the feed named no version");
    return {
      version,
      reason: null,
      checkedAt,
      verified: true,
      artifact: artifactFromFeed(body),
    };
  } catch {
    return fail("the feed could not be reached");
  }
}
