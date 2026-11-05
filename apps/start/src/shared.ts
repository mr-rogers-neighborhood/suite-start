/**
 * What the launcher window asks the main process for.
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
} as const;

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

export interface LauncherState {
  readonly apps: readonly AppCard[];
  readonly recents: readonly RecentCard[];
  readonly refused: readonly RefusedInstall[];
  readonly version: string;
}
