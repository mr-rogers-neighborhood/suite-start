import { type SuiteAppName, type SuiteCapability, type SuiteReleaseChannel } from "@suite/contracts";
import { type FeedArtifact, type FeedFetch } from "@suite/desktop";
/**
 * What the suite offers, whether or not it is on this machine.
 *
 * Start used to list what it found. A list of what is found is empty on a new machine,
 * and empty is the one answer the front door cannot give. So the catalogue names the
 * three apps the suite has, compiles in the feed each one declares, and asks each feed
 * what version it offers. A card then has something true to say either way.
 *
 * **The feed URL appears three times on purpose, and this is the third.** The app's own
 * `suite.app.json` declares it for its updater, `electron-builder.yml` writes it beside a
 * packaged binary, and this table holds it because an app that is not installed has no
 * manifest to read it from. Installed or not, the signature still has to verify against
 * the key compiled into `@suite/desktop`, so a wrong URL buys nothing.
 *
 * **When the network is read.** When the launcher opens, and when a person presses a
 * button asking it to look again. Not on a timer, and never to download: a version can be
 * read, an artifact is only fetched when somebody asks for it.
 */
/** One app the suite offers, and where its releases are published. */
export interface CatalogueEntry {
    readonly id: string;
    /** What a person calls it. Also what an installed manifest will say. */
    readonly name: string;
    /** The folder under the documents root, which install's own folder sits beside. */
    readonly folder: SuiteAppName;
    readonly extensions: readonly string[];
    readonly capabilities: readonly SuiteCapability[];
    /** The app's own declared feed. Blank for the hub, whose feed is read at runtime. */
    readonly feed: string;
    readonly channel: SuiteReleaseChannel;
    /**
     * Where a person can fetch a newer build by hand.
     *
     * Only the hub has one: every other app's update is a button Start can press, and the
     * hub cannot replace its own running binary.
     */
    readonly releases?: string | undefined;
}
/** The hub's own id. It is not one of the apps the hub lists. */
export declare const SELF_ID = "start";
/**
 * The three document apps.
 *
 * Every field here mirrors that app's own `suite.app.json` and `electron-builder.yml`:
 * the id, the name, the extension, the capabilities, the channel and the feed. A test
 * cannot read a sibling checkout, so it checks what can be checked — that the ids,
 * folders and extensions agree with `SUITE_APPS` — and this comment carries the rest.
 *
 * Start writes these into the manifest an install leaves behind, because an AppImage
 * carries its own copy inside the image where nothing can read it without unpacking.
 * The version in that manifest comes from the signed feed, never from here.
 */
export declare const CATALOGUE_APPS: readonly [{
    readonly id: "canvas";
    readonly name: "Suite Canvas";
    readonly folder: "Canvas";
    readonly extensions: readonly ["canvas"];
    readonly capabilities: readonly ["document.file", "sync", "attachments", "publish"];
    readonly feed: "https://github.com/mr-rogers-neighborhood/suite-canvas/releases/latest/download";
    readonly channel: "alpha";
}, {
    readonly id: "planner";
    readonly name: "Suite Planner";
    readonly folder: "Planner";
    readonly extensions: readonly ["planner"];
    readonly capabilities: readonly ["document.file"];
    readonly feed: "https://github.com/mr-rogers-neighborhood/suite-planner/releases/latest/download";
    readonly channel: "alpha";
}, {
    readonly id: "budget";
    readonly name: "Suite Budget";
    readonly folder: "Budget";
    readonly extensions: readonly ["budget"];
    readonly capabilities: readonly ["document.file"];
    readonly feed: "https://github.com/mr-rogers-neighborhood/suite-budget/releases/latest/download";
    readonly channel: "alpha";
}];
/** Whether the catalogue still says the same thing `SUITE_APPS` does. */
export declare function catalogueMatchesContracts(): readonly string[];
/** The hub's own row: a name and a channel, with its feed supplied by the build. */
export declare const SELF_ENTRY: CatalogueEntry;
/** What the catalogue knows about one app. */
export interface CatalogueApp extends CatalogueEntry {
    /** The feed this answer came from. */
    readonly feed: string;
    /** The version the signed feed offers, or null when it offered nothing verifiable. */
    readonly available: string | null;
    /** Why `available` is null, in words a card can show. */
    readonly reason: string | null;
    /** The version installed here, or null when this machine does not have it. */
    readonly installed: string | null;
    /** True only when both versions are known and the feed's is the later one. */
    readonly newer: boolean;
    /**
     * The file an install would download, from the same verified manifest.
     *
     * Null when nothing verified, or when the manifest named no file; an install then has
     * nothing it is allowed to fetch.
     */
    readonly artifact: FeedArtifact | null;
}
export interface CatalogueOptions {
    /** What is installed here, by app id: the version that install reports. */
    readonly installed: ReadonlyMap<string, string>;
    /**
     * A root that replaces every compiled feed, with one folder per app id under it.
     *
     * This is the seam a local folder of releases uses: `<base>/planner`, `<base>/start`.
     */
    readonly feedBase?: string | undefined;
    /** The hub's own feed, read from the `app-update.yml` beside a packaged binary. */
    readonly selfFeed?: string | null;
    readonly platform?: string;
    readonly fetch?: FeedFetch;
    readonly now?: () => Date;
    /** Overridable so a test can prove the accepting path without the publisher's key. */
    readonly publicKey?: string | undefined;
}
/**
 * The feed to read for one entry.
 *
 * A base replaces the whole URL rather than a prefix: a local release folder holds one
 * folder per app, and rewriting a GitHub path would describe a server that does not exist.
 */
export declare function feedFor(entry: CatalogueEntry, feedBase?: string | undefined): string | null;
/** Whether `available` is a later version than `installed`. Unparseable versions are not. */
export declare function isNewer(available: string | null, installed: string | null): boolean;
/**
 * The catalogue after one install: the new version, and nothing else re-read.
 *
 * A feed answer is still the answer from the last check, so this refetches nothing and
 * claims nothing: it only records what is now on disk.
 */
export declare function withInstalled(catalogue: readonly CatalogueApp[], id: string, version: string): readonly CatalogueApp[];
/**
 * Every app the suite offers, each with what is installed and what is offered.
 *
 * The hub's own row is included, and always last: it cannot replace its own running
 * binary, so it is shown as a fact rather than as a button.
 */
export declare function readCatalogue(options: CatalogueOptions): Promise<readonly CatalogueApp[]>;
//# sourceMappingURL=catalogue.d.ts.map