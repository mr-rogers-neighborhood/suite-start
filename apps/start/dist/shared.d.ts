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
    readonly info: "suite:start:info";
};
/** Pushed rather than invoked: the window redraws from what arrives here. */
export declare const START_CHANGED = "suite:start:changed";
export type StartChannel = (typeof START_IPC)[keyof typeof START_IPC];
/** One app card. */
export interface AppCard {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly executable: string;
    readonly fileExtensions: readonly string[];
    readonly lastOpenedAt: number | null;
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
    readonly installRoots: readonly string[];
}
export interface LauncherState {
    readonly apps: readonly AppCard[];
    readonly recents: readonly RecentCard[];
    readonly refused: readonly RefusedInstall[];
    readonly settings: StartSettings;
    readonly version: string;
}
//# sourceMappingURL=shared.d.ts.map