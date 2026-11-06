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
    readonly recents: "suite:start:recents";
    readonly forgetRecent: "suite:start:forget";
    readonly openFile: "suite:start:open-file";
    readonly info: "suite:start:info";
};
/** Pushed rather than invoked: the window redraws from what arrives here. */
export declare const START_CHANGED = "suite:start:changed";
export type StartChannel = (typeof START_IPC)[keyof typeof START_IPC];
/** Whether an install can be launched, and why not when it cannot. */
export type AppHealth = {
    readonly ok: true;
} | {
    readonly ok: false;
    readonly reason: string;
};
/** One app card, installed or refused. */
export interface AppCard {
    /** Null for a refused install with no record, because there is nothing to act on. */
    readonly id: string | null;
    readonly name: string;
    readonly version: string;
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
}
//# sourceMappingURL=shared.d.ts.map