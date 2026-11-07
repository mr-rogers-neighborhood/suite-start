/*
 * The hub bridge.
 *
 * CommonJS because a sandboxed preload cannot use ESM imports. The channel names
 * are spelled here for the same reason, and `bridge.test.ts` fails if they drift
 * from `src/shared.ts`.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("suiteStart", {
  host: "start",
  version: process.env.SUITE_START_VERSION || "0.0.0",
  listApps: () => ipcRenderer.invoke("suite:start:list"),
  launch: (id) => ipcRenderer.invoke("suite:start:launch", id),
  addApp: () => ipcRenderer.invoke("suite:start:add"),
  removeApp: (id) => ipcRenderer.invoke("suite:start:remove", id),
  // Install or update one app from its signed feed. The bar arrives on its own
  // channel below, because a download moves far more often than a window redraws.
  installApp: (id) => ipcRenderer.invoke("suite:start:install", id),
  recents: () => ipcRenderer.invoke("suite:start:recents"),
  forgetRecent: (path) => ipcRenderer.invoke("suite:start:forget", path),
  openFile: (path) => ipcRenderer.invoke("suite:start:open-file", path),
  // On demand: the page asks, main fetches, nothing runs on a timer.
  checkUpdates: () => ipcRenderer.invoke("suite:start:check-updates"),
  info: () => ipcRenderer.invoke("suite:start:info"),
  // The relay this machine runs. The page can start, stop and widen it, and read
  // what it holds — which is a count of encrypted frames and who may write.
  startSync: () => ipcRenderer.invoke("suite:start:sync-start"),
  stopSync: () => ipcRenderer.invoke("suite:start:sync-stop"),
  setSyncScope: (scope) => ipcRenderer.invoke("suite:start:sync-scope", scope),
  // The window outlives no page load, so the listener is never removed.
  onChanged: (listener) => {
    ipcRenderer.on("suite:start:changed", (_event, state) => listener(state));
  },
  // One app's install progress, and only while one is running.
  onInstallProgress: (listener) => {
    ipcRenderer.on("suite:start:install-progress", (_event, installing) => listener(installing));
  },
});
