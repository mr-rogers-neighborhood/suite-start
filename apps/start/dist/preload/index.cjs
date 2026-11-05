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
  recents: () => ipcRenderer.invoke("suite:start:recents"),
  forgetRecent: (path) => ipcRenderer.invoke("suite:start:forget", path),
  openFile: (path) => ipcRenderer.invoke("suite:start:open-file", path),
  info: () => ipcRenderer.invoke("suite:start:info"),
  // The window outlives no page load, so the listener is never removed.
  onChanged: (listener) => {
    ipcRenderer.on("suite:start:changed", (_event, state) => listener(state));
  },
});
