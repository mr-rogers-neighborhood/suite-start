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
    recents: "suite:start:recents",
    forgetRecent: "suite:start:forget",
    info: "suite:start:info",
};
/** Pushed rather than invoked: the window redraws from what arrives here. */
export const START_CHANGED = "suite:start:changed";
//# sourceMappingURL=shared.js.map