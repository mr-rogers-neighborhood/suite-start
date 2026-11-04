import type { SuiteAppManifest } from "@suite/contracts";
/**
 * What is installed, and what may be launched.
 *
 * Two records make one app:
 *
 * - the **manifest** (`suite.app.json`), which the app ships and signs, and which
 *   says what it is, what files it opens, and which contract it expects;
 * - the **install record**, which Start writes when it installs something, and
 *   which is the only place an executable path lives.
 *
 * Keeping them apart is the point. A manifest is data that arrives from the app;
 * nothing in it may name a binary, so a tampered manifest cannot redirect a
 * launch. Discovery joins the two and refuses anything that does not line up.
 *
 * The filesystem is a port, so discovery is a test rather than a fixture
 * directory: `readText` and `listDirectories` are all it needs.
 */
/** Name a packaged app ships beside its own executable resources. */
export declare const APP_MANIFEST_FILENAME = "suite.app.json";
/** One install, as the OS installer or Start's own installer recorded it. */
export interface InstallRecord {
    readonly id: string;
    /** Absolute path to the executable. Validated before it is ever spawned. */
    readonly executable: string;
    readonly installedAt?: string;
}
export interface RegistryFileSystem {
    readonly readText: (path: string) => Promise<string>;
    /** Immediate child directory names under `path`. */
    readonly listDirectories: (path: string) => Promise<readonly string[]>;
}
export interface DiscoverOptions {
    /** Directories whose children each carry a `suite.app.json`. */
    readonly roots: readonly string[];
    readonly records: readonly InstallRecord[];
    readonly fileSystem: RegistryFileSystem;
    /** The contract this build of Start implements. */
    readonly hubContract?: string;
}
export interface DiscoveredApp {
    readonly manifest: SuiteAppManifest;
    readonly manifestPath: string;
    readonly executable: string;
    readonly installedAt: string | null;
}
export interface RejectedInstall {
    readonly path: string;
    readonly reason: string;
}
export interface DiscoveryResult {
    readonly apps: readonly DiscoveredApp[];
    readonly rejected: readonly RejectedInstall[];
}
/**
 * Read every manifest under the roots and pair it with its install record.
 *
 * Rejections are collected rather than thrown: one broken install must not stop
 * the launcher from starting the other two. Duplicate ids keep the first and
 * report the rest, so a stale second install is visible instead of silent.
 */
export declare function discoverApps(options: DiscoverOptions): Promise<DiscoveryResult>;
/** The app that claims a file extension, if any. */
export declare function appForExtension(apps: readonly DiscoveredApp[], extension: string): DiscoveredApp | null;
/** The app with this id, if installed. */
export declare function appById(apps: readonly DiscoveredApp[], id: string): DiscoveredApp | null;
//# sourceMappingURL=registry.d.ts.map