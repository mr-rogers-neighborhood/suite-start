import type { FeedArtifact } from "@suite/desktop";
import type { CatalogueEntry } from "./catalogue.js";
import type { RegistryStore } from "./installs.js";
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
export type Download = (url: string, destination: string, onProgress?: DownloadProgress) => Promise<void>;
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
export declare function appDirectory(appsRoot: string, entry: CatalogueEntry, version: string): string;
/** The manifest an install leaves beside its executable. */
export declare function manifestText(entry: CatalogueEntry, version: string, feed: string): string;
/** The versions of one app that are on disk, newest first. */
export declare function installedVersions(appsRoot: string, entry: CatalogueEntry): Promise<readonly string[]>;
/**
 * How many replaced versions are kept beside the current one.
 *
 * One. Not a version history — a single step back. The point is that a bad update is a
 * button, not a reinstall: a person who just agreed to 0.2.0 and found it worse can
 * return to 0.1.0 without a network. Keeping more would make the hub a package manager
 * with retention policy, which is a much bigger promise than this one.
 */
export declare const RETAINED_VERSIONS = 1;
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
export declare function pruneOtherVersions(appsRoot: string, entry: CatalogueEntry, keep: string, retain?: number): Promise<void>;
/**
 * The executable inside one installed version.
 *
 * An install record names one path, so a version kept for a rollback needs its own lookup:
 * the directory holds the artifact and its manifest, and the manifest never names a binary
 * (§registry). The artifact is whichever regular file is executable and is not the
 * manifest — which is also how a person would tell them apart in a file manager.
 */
export declare function executableInVersion(appsRoot: string, entry: CatalogueEntry, version: string): Promise<string | null>;
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
export declare function repairableInstalls(records: readonly {
    readonly id: string;
    readonly executable: string;
}[], appsRoot: string, exists: (path: string) => boolean): readonly {
    readonly id: string;
    readonly executable: string;
}[];
/** The base64 SHA-512 of a file, which is the form `electron-builder` writes. */
export declare function fingerprintOfFile(path: string): Promise<string>;
/**
 * Streaming download: an AppImage is large, and holding one in memory is not a feature.
 *
 * The fetch is a parameter so the caller can hand in Electron's `net.fetch`, which is the
 * one that reads a `file:` URL and therefore the one that can install from a folder.
 */
export declare function downloadWith(fetchImpl?: typeof globalThis.fetch): Download;
/**
 * Download, verify, place, record. The one function an Install button calls.
 *
 * A replacement for a version already on disk moves the old directory aside first and
 * puts it back if placing the new one fails, so "replaced" always means the whole app.
 */
export declare function installApp(request: InstallRequest): Promise<InstalledApp>;
//# sourceMappingURL=install.d.ts.map