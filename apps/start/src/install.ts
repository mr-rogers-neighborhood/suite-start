import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, type Dirent } from "node:fs";
import { access, chmod, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  CONTRACT_VERSION,
  compareSemver,
  parseSemver,
  SUITE_PROTOCOL_PREFIX,
} from "@suite/contracts";
import type { FeedArtifact } from "@suite/desktop";
import type { CatalogueEntry } from "./catalogue.js";
import type { RegistryStore } from "./installs.js";
import { APP_MANIFEST_FILENAME } from "./registry.js";

/**
 * Placing an app, and replacing one.
 *
 * An AppImage is one executable file; there is nothing to unpack and no system
 * installer to call. So an install is: download, check the bytes against the
 * fingerprint the *signed* manifest named, put the file where it belongs, make it
 * executable, and record where it went.
 *
 * The order is the safety property. Nothing is written into the install directory
 * until the download has been verified, and the record is written last, so a failure
 * at any step leaves either the previous install or nothing — never half of both.
 *
 * The manifest a packaged app carries sits inside its own image, where nothing can
 * read it without unpacking. Start writes the one beside the installed file from its
 * own catalogue plus the version a signature vouched for, which is why the catalogue
 * repeats what each app's manifest says.
 */

/** Bytes written and bytes expected, for a bar that moves. */
export type DownloadProgress = (received: number, total: number | null) => void;

/** Fetches one URL to a file. Injected so a test never touches the network. */
export type Download = (
  url: string,
  destination: string,
  onProgress?: DownloadProgress,
) => Promise<void>;

export interface InstallRequest {
  readonly entry: CatalogueEntry;
  /** The version the verified feed named. */
  readonly version: string;
  /** The artifact that same verified manifest named. */
  readonly artifact: FeedArtifact;
  /** The feed to download from; it is also what the written manifest records. */
  readonly feed: string;
  /** The applications root, `<home>/Applications/Suite` by default. */
  readonly appsRoot: string;
  readonly registry: RegistryStore;
  readonly download?: Download;
  /**
   * The fetch a download uses when `download` is not given.
   *
   * Main passes Electron's, because only that one can read a `file:` URL — which is what
   * a feed in a local folder is.
   */
  readonly fetch?: typeof globalThis.fetch;
  /** Called as bytes arrive. The card's progress bar is the only consumer. */
  readonly onProgress?: DownloadProgress;
  readonly now?: () => Date;
}

export interface InstalledApp {
  readonly id: string;
  readonly version: string;
  /** Absolute path to the executable. This is what the record names. */
  readonly executable: string;
  readonly manifestPath: string;
}

/** Where one version of one app lives. */
export function appDirectory(appsRoot: string, entry: CatalogueEntry, version: string): string {
  return join(appsRoot, entry.folder, version);
}

/** The manifest an install leaves beside its executable. */
export function manifestText(entry: CatalogueEntry, version: string, feed: string): string {
  return `${JSON.stringify(
    {
      format: "suite.app",
      id: entry.id,
      name: entry.name,
      version,
      contractVersion: CONTRACT_VERSION,
      deepLinkPrefix: `${SUITE_PROTOCOL_PREFIX}${entry.id}/`,
      fileExtensions: [...entry.extensions],
      update: { feed, channel: entry.channel },
      capabilities: [...entry.capabilities],
    },
    null,
    2,
  )}\n`;
}

/** The versions of one app that are on disk, newest first. */
export async function installedVersions(
  appsRoot: string,
  entry: CatalogueEntry,
): Promise<readonly string[]> {
  let found: Dirent[];
  try {
    found = await readdir(join(appsRoot, entry.folder), { withFileTypes: true });
  } catch {
    return [];
  }
  return (
    found
      // A dot directory is a replacement in progress, never a version to offer.
      .filter((candidate) => candidate.isDirectory() && !candidate.name.startsWith("."))
      .map((candidate) => candidate.name)
      .sort((left, right) => {
        const a = parseSemver(left);
        const b = parseSemver(right);
        if (a !== null && b !== null) return compareSemver(b, a);
        return left < right ? 1 : left > right ? -1 : 0;
      })
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** The base64 SHA-512 of a file, which is the form `electron-builder` writes. */
export async function fingerprintOfFile(path: string): Promise<string> {
  const hash = createHash("sha512");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest("base64");
}

/**
 * Streaming download: an AppImage is large, and holding one in memory is not a feature.
 *
 * The fetch is a parameter so the caller can hand in Electron's `net.fetch`, which is the
 * one that reads a `file:` URL and therefore the one that can install from a folder.
 */
export function downloadWith(fetchImpl: typeof globalThis.fetch = globalThis.fetch): Download {
  return async (url, destination, onProgress) => {
    const response = await fetchImpl(url);
    if (!response.ok) throw new Error(`the feed answered ${response.status}`);
    if (response.body === null) throw new Error("the feed returned no file");

    const announced = Number.parseInt(response.headers.get("content-length") ?? "", 10);
    const total = Number.isFinite(announced) ? announced : null;
    let received = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.byteLength;
        onProgress?.(received, total);
        callback(null, chunk);
      },
    });

    // `fetch` in Electron's main process takes its types from the DOM, and `fromWeb`
    // takes them from Node's own stream/web. They are the same object.
    const body = response.body as unknown as import("node:stream/web").ReadableStream;
    await pipeline(Readable.fromWeb(body), counter, createWriteStream(destination));
  };
}

/**
 * Download, verify, place, record. The one function an Install button calls.
 *
 * A replacement for a version already on disk moves the old directory aside first and
 * puts it back if placing the new one fails, so "replaced" always means the whole app.
 */
export async function installApp(request: InstallRequest): Promise<InstalledApp> {
  const { entry, version, artifact, feed, appsRoot, registry } = request;
  const download = request.download ?? downloadWith(request.fetch);
  const now = request.now ?? (() => new Date());

  const target = appDirectory(appsRoot, entry, version);
  const stagingRoot = join(appsRoot, ".staging");
  await mkdir(stagingRoot, { recursive: true });
  const staging = await mkdtemp(join(stagingRoot, `${entry.id}-`));

  try {
    const downloaded = join(staging, artifact.path);
    await download(`${feed.replace(/\/+$/u, "")}/${artifact.path}`, downloaded, request.onProgress);

    const actual = await fingerprintOfFile(downloaded);
    if (actual !== artifact.sha512) {
      throw new Error("the downloaded file does not match the fingerprint the feed signed");
    }

    await mkdir(join(appsRoot, entry.folder), { recursive: true });
    // Beside the target and dot-named, so the move is atomic and a half-replaced app
    // is never mistaken for a version.
    const aside = join(dirname(target), `.${version}.replacing`);
    const replacing = await exists(target);
    if (replacing) await rename(target, aside);

    let installed: InstalledApp;
    try {
      await mkdir(target, { recursive: true });
      const executable = join(target, artifact.path);
      await rename(downloaded, executable);
      await chmod(executable, 0o755);
      const manifestPath = join(target, APP_MANIFEST_FILENAME);
      await writeFile(manifestPath, manifestText(entry, version, feed));

      // The record is last: a card may only claim an install that is complete.
      await registry.add({
        id: entry.id,
        executable,
        manifestPath,
        installedAt: now().toISOString(),
      });
      installed = { id: entry.id, version, executable, manifestPath };
    } catch (error) {
      await rm(target, { recursive: true, force: true });
      if (replacing) await rename(aside, target);
      throw error;
    }

    if (replacing) await rm(aside, { recursive: true, force: true });
    return installed;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
