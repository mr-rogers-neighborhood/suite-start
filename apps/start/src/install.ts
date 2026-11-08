import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, type Dirent } from "node:fs";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
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
  /**
   * Remove every other version of this app once the new one is in place.
   *
   * Set for an update, and never for a first install: a replace is the moment "which
   * version am I running" should have one answer, where an install may be adding a
   * version beside one somebody kept on purpose.
   */
  readonly prune?: boolean;
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

/**
 * How many replaced versions are kept beside the current one.
 *
 * One. Not a version history — a single step back. The point is that a bad update is a
 * button, not a reinstall: a person who just agreed to 0.2.0 and found it worse can
 * return to 0.1.0 without a network. Keeping more would make the hub a package manager
 * with retention policy, which is a much bigger promise than this one.
 */
export const RETAINED_VERSIONS = 1;

/**
 * Remove the versions of an app that are neither current nor recently replaced.
 *
 * Best effort: a version directory that will not delete is not a failed install, so it is
 * reported and the app stays installed. A running copy survives it — on Linux the file a
 * live process holds stays until the process lets go.
 *
 * `installedVersions` answers newest first, so the retained ones are the head of the list
 * and everything after it is stale. That is order-independent on purpose: it works the same
 * on the way up and on the way back down from a rollback.
 */
export async function pruneOtherVersions(
  appsRoot: string,
  entry: CatalogueEntry,
  keep: string,
  retain: number = RETAINED_VERSIONS,
): Promise<void> {
  const others = (await installedVersions(appsRoot, entry)).filter((version) => version !== keep);
  const stale = others.slice(Math.max(0, retain));
  await Promise.all(
    stale.map(async (version) => {
      try {
        await rm(appDirectory(appsRoot, entry, version), { recursive: true, force: true });
      } catch (error) {
        console.warn(`[install] could not remove ${entry.name} ${version}`, error);
      }
    }),
  );
}

/**
 * The executable inside one installed version.
 *
 * An install record names one path, so a version kept for a rollback needs its own lookup:
 * the directory holds the artifact and its manifest, and the manifest never names a binary
 * (§registry). The artifact is whichever regular file is executable and is not the
 * manifest — which is also how a person would tell them apart in a file manager.
 */
export async function executableInVersion(
  appsRoot: string,
  entry: CatalogueEntry,
  version: string,
): Promise<string | null> {
  const directory = appDirectory(appsRoot, entry, version);
  let found: Dirent[];
  try {
    found = await readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const candidate of found) {
    if (!candidate.isFile() || candidate.name === APP_MANIFEST_FILENAME) continue;
    const path = join(directory, candidate.name);
    const info = await stat(path).catch(() => null);
    if (info !== null && (info.mode & 0o111) !== 0) return path;
  }

  return null;
}

/**
 * The installs whose menu entry should be rewritten, given what is on disk.
 *
 * A menu entry is written when an app is installed or updated, which leaves one gap: an
 * entry already on the machine is never revisited. That is how three apps shared one icon
 * for a whole release — the fix shipped, and the entries nobody replaced kept the old
 * artwork until their next update.
 *
 * So startup repairs them. Only Start's own installs qualify: a copy somebody placed
 * themselves has no record, and a record whose binary has gone is a card that already says
 * so. `exists` is injected so this is a rule with a test rather than a walk of the filesystem.
 */
export function repairableInstalls(
  records: readonly { readonly id: string; readonly executable: string }[],
  appsRoot: string,
  exists: (path: string) => boolean,
): readonly { readonly id: string; readonly executable: string }[] {
  const root = appsRoot.endsWith("/") ? appsRoot : `${appsRoot}/`;
  return records.filter(
    (record) => record.executable.startsWith(root) && exists(record.executable),
  );
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
      if (request.prune === true) await pruneOtherVersions(appsRoot, entry, version);
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
