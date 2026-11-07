import type { SuiteReleaseChannel } from "@suite/contracts";
import type { ReportedUpdate } from "./reportedUpdate.js";
/**
 * What the hub window asks the main process for.
 *
 * Same discipline as the Canvas bridge: no method takes a path it wants written,
 * and every one is a capability the main process chooses to grant. `addApp` runs
 * a file picker in main, so the renderer never learns a directory it could point
 * somewhere else.
 */
export declare const START_IPC: {
    readonly listApps: "suite:start:list";
    readonly launch: "suite:start:launch";
    readonly addApp: "suite:start:add";
    readonly removeApp: "suite:start:remove";
    readonly installApp: "suite:start:install";
    readonly recents: "suite:start:recents";
    readonly forgetRecent: "suite:start:forget";
    readonly openFile: "suite:start:open-file";
    readonly checkUpdates: "suite:start:check-updates";
    readonly startSync: "suite:start:sync-start";
    readonly stopSync: "suite:start:sync-stop";
    readonly setSyncScope: "suite:start:sync-scope";
    readonly info: "suite:start:info";
};
/** Pushed rather than invoked: the window redraws from what arrives here. */
export declare const START_CHANGED = "suite:start:changed";
/**
 * Pushed while an install runs, and only then.
 *
 * A whole `LauncherState` carries an index of every document on this machine, which is
 * far too much to send per downloaded chunk; this is the one thing that changes while a
 * bar moves.
 */
export declare const START_INSTALL_PROGRESS = "suite:start:install-progress";
export type StartChannel = (typeof START_IPC)[keyof typeof START_IPC];
/** Whether an install can be launched, and why not when it cannot. */
export type AppHealth = {
    readonly ok: true;
} | {
    readonly ok: false;
    readonly reason: string;
};
/**
 * What a card is offering, in the four honest states and the two corners around them.
 *
 * `local` is the app a person built themselves: D44 makes it first-class, so it is not
 * a lesser card — it simply is not in the suite's catalogue, and this hub has no feed to
 * offer it versions from. `refused` is an install that cannot be launched.
 */
export type AppCardState = "not-installed" | "no-release" | "update-available" | "current" | "local" | "refused";
/** How one install is going, for the bar that replaces its button. */
export interface InstallProgress {
    readonly id: string;
    readonly phase: "downloading" | "placed" | "failed";
    /** Bytes written so far. Zero unless something is being downloaded. */
    readonly received: number;
    /** Bytes the feed said to expect, or null when it did not say. */
    readonly total: number | null;
    /** What went wrong, in the same words the card will show. */
    readonly reason: string | null;
}
/** One app card, installed, offered, or refused. */
export interface AppCard {
    /** Null for a refused install with no record, because there is nothing to act on. */
    readonly id: string | null;
    readonly name: string;
    readonly state: AppCardState;
    /** The version installed here, or null when this machine does not have it. */
    readonly version: string | null;
    /** The version the feed offers, when one verified. */
    readonly available: string | null;
    /** Why no version is offered, when none is. */
    readonly reason: string | null;
    /** Where a newer build can be fetched by hand, when this app cannot fetch it itself. */
    readonly releases: string | null;
    /** How many versions of this app are on disk here. */
    readonly versions: number;
    readonly channel: SuiteReleaseChannel;
    /** What the app says about its own updating, or `unknown` before it has asked. */
    readonly update: ReportedUpdate;
    readonly executable: string | null;
    readonly fileExtensions: readonly string[];
    readonly lastOpenedAt: number | null;
    /** How many documents the index found in this app's folder. */
    readonly fileCount: number;
    readonly health: AppHealth;
}
/** One file the index found, with the app that claims it. */
export interface FileCard {
    readonly path: string;
    readonly name: string;
    readonly appId: string;
    readonly appName: string;
    readonly folder: string;
    readonly modifiedAt: number;
    readonly installed: boolean;
    /** The link that opens this document in its app, when its name survives one. */
    readonly link: string | null;
}
/** One recent file. */
export interface RecentCard {
    readonly path: string;
    readonly name: string;
    readonly appId: string;
    readonly appName: string;
    readonly openedAt: number;
}
/** A refused install, shown so a broken app is visible rather than absent. */
export interface RefusedInstall {
    readonly path: string;
    readonly reason: string;
}
/** What Start knows about itself, for the Settings pane. */
export interface StartSettings {
    readonly dataDirectory: string;
    readonly documentsRoot: string;
    readonly installRoots: readonly string[];
}
export interface LauncherState {
    readonly apps: readonly AppCard[];
    readonly recents: readonly RecentCard[];
    readonly files: readonly FileCard[];
    readonly settings: StartSettings;
    readonly version: string;
    /** The relay this machine runs, and what it is holding. */
    readonly sync: SyncState;
    /** Installs running right now, so a window that opens mid-install still sees the bar. */
    readonly installing: readonly InstallProgress[];
    /** The hub's own row, which it can show but cannot act on. */
    readonly self: AppCard | null;
}
/** What the Sync pane shows. No document content, because the host has none. */
export interface SyncState {
    readonly running: boolean;
    readonly scope: "loopback" | "network";
    readonly address: string | null;
    readonly port: number;
    readonly workspaces: readonly SyncWorkspace[];
}
export interface SyncWorkspace {
    readonly workspaceId: string;
    readonly frames: number;
    readonly newestEpoch: number | null;
    readonly members: readonly SyncMember[];
    /**
     * Whether any app on this machine kept a way back in for this workspace.
     *
     * Read from the apps' own reports, not from the host: the hub carries frames and cannot
     * know what a device saved, and a pane that guessed would be worse than one that is quiet.
     */
    readonly recovery: "made" | "declined" | "none";
}
export interface SyncMember {
    readonly deviceId: string;
    readonly name: string;
    readonly role: "owner" | "editor" | "viewer" | null;
}
//# sourceMappingURL=shared.d.ts.map