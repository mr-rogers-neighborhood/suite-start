/**
 * What the hub window asks the main process for.
 *
 * Same discipline as the Canvas bridge: no method takes a path it wants written,
 * and every one is a capability the main process chooses to grant. `addApp` runs
 * a file picker in main, so the renderer never learns a directory it could point
 * somewhere else.
 */
export const START_IPC = {
    listApps: "suite:start:list",
    launch: "suite:start:launch",
    addApp: "suite:start:add",
    removeApp: "suite:start:remove",
    installApp: "suite:start:install",
    recents: "suite:start:recents",
    forgetRecent: "suite:start:forget",
    openFile: "suite:start:open-file",
    checkUpdates: "suite:start:check-updates",
    startSync: "suite:start:sync-start",
    stopSync: "suite:start:sync-stop",
    setSyncScope: "suite:start:sync-scope",
    info: "suite:start:info",
};
/** Pushed rather than invoked: the window redraws from what arrives here. */
export const START_CHANGED = "suite:start:changed";
/**
 * Pushed while an install runs, and only then.
 *
 * A whole `LauncherState` carries an index of every document on this machine, which is
 * far too much to send per downloaded chunk; this is the one thing that changes while a
 * bar moves.
 */
export const START_INSTALL_PROGRESS = "suite:start:install-progress";
//# sourceMappingURL=shared.js.map