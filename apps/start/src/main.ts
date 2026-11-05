import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  appDocumentsFolder,
  parseDeepLink,
  SUITE_APPS,
  type SuiteAppEntry,
  suiteDocumentsRoot,
} from "@suite/contracts";
import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, shell } from "electron";
import { appCards } from "./cards.js";
import { type CatalogRead, catalogPathFromEnv, readCatalog } from "./catalog.js";
import { type DocumentsFolder, indexDocuments, isInsideDocuments } from "./fileIndex.js";
import { type RegistryStore, registryStore } from "./installs.js";
import { defaultRoots, nodeRegistryFileSystem } from "./nodeFileSystem.js";
import { RECENT_LIMIT, type RecentsFile, recentsFile } from "./recents.js";
import { appById, type DiscoveredApp, discoverApps, type InstallRecord } from "./registry.js";
import { describeRouteRejection, routeLaunch } from "./route.js";
import {
  type CatalogSummary,
  type LauncherState,
  type RecentCard,
  START_CHANGED,
  START_IPC,
} from "./shared.js";

/**
 * Suite Start.
 *
 * The suite's home: it discovers apps, starts one, remembers what was opened,
 * and reports what it knows. It holds no document, proxies no bytes, and never
 * runs an app's code — which is what keeps one app's bad update from taking the
 * other two down with it.
 */

/**
 * Where this application lives.
 *
 * `app.getAppPath()` rather than the working directory: a launcher started from
 * a desktop entry, a shell or another process inherits whatever directory that
 * process had, and the bundle is not there.
 */
function appDir(): string {
  return app.getAppPath();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "start",
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

let window: BrowserWindow | null = null;
let registry: RegistryStore;
let recents: RecentsFile;
let dataDirectory = "";

/** Files and links handed over before the window exists. */
const pendingTargets: string[] = [];

function roots(): readonly string[] {
  return defaultRoots(app.getPath("home"), process.platform);
}

/** The documents root, unless `SUITE_START_DOCUMENTS` replaces it for a test. */
function documentsRoot(): string {
  return suiteDocumentsRoot(
    process.platform,
    app.getPath("home"),
    process.env.SUITE_START_DOCUMENTS,
  );
}

function documentFolders(): readonly DocumentsFolder[] {
  const platform = process.platform;
  const home = app.getPath("home");
  const rootOverride = process.env.SUITE_START_DOCUMENTS;
  return SUITE_APPS.map((entry: SuiteAppEntry) => ({
    app: entry,
    path: appDocumentsFolder(entry, {
      platform,
      home,
      rootOverride,
      xdgDataHome: process.env.XDG_DATA_HOME,
    }),
  }));
}

async function discover(): Promise<{
  apps: readonly DiscoveredApp[];
  refused: readonly { path: string; reason: string }[];
}> {
  const result = await discoverApps({
    roots: roots(),
    records: await registry.list(),
    fileSystem: nodeRegistryFileSystem(),
  });
  return { apps: result.apps, refused: result.rejected };
}

function catalogSummary(read: CatalogRead): CatalogSummary {
  if (read.state === "configured") return { state: "configured", path: read.path, reason: null };
  if (read.state === "refused") return { state: "refused", path: read.path, reason: read.reason };
  return { state: "none", path: null, reason: null };
}

async function state(): Promise<LauncherState> {
  const { apps, refused } = await discover();
  const recent = await recents.list();
  const catalogRead = await readCatalog(catalogPathFromEnv(), nodeRegistryFileSystem());
  const files = await indexDocuments(
    documentFolders(),
    nodeRegistryFileSystem(),
    new Set(apps.map((entry) => entry.manifest.id)),
  );

  const cards = appCards({
    apps,
    rejected: refused,
    files,
    recents: recent,
    catalog: catalogRead,
  });

  const recentCards: RecentCard[] = recent
    .flatMap((row): RecentCard[] => {
      const owner = apps.find((entry) => entry.manifest.id === row.appId);
      if (!owner) return [];
      return [
        {
          path: row.path,
          name: row.path.split(/[\\/]/u).at(-1) ?? row.path,
          appId: row.appId,
          appName: owner.manifest.name,
          openedAt: row.openedAt,
        },
      ];
    })
    .slice(0, RECENT_LIMIT);

  return {
    apps: cards,
    recents: recentCards,
    files,
    settings: { dataDirectory, documentsRoot: documentsRoot(), installRoots: roots() },
    catalog: catalogSummary(catalogRead),
    version: app.getVersion(),
  };
}

/**
 * Start a process and let go of it.
 *
 * Detached, no inherited stdio, and `unref`, so an app outlives the launcher in
 * the same way a browser tab outlives the window that opened it.
 */
function spawnApp(app_: DiscoveredApp, argv: readonly string[]): void {
  const child = spawn(app_.executable, [...argv], { detached: true, stdio: "ignore" });
  child.unref();
}

/** Resolve one target and start the app that owns it. */
async function open(target: string): Promise<void> {
  const { apps } = await discover();
  const routed = routeLaunch(target, apps);
  if (!routed.ok) {
    const message = describeRouteRejection(routed.reason);
    if (window) {
      await dialog.showMessageBox(window, { type: "warning", title: "Suite Start", message });
    }
    return;
  }
  spawnApp(routed.plan.app, routed.plan.argv);
  if (routed.plan.why === "file") {
    await recents.remember({ path: target.trim(), appId: routed.plan.app.manifest.id });
  }
  await broadcast();
}

async function broadcast(): Promise<void> {
  if (!window) return;
  window.webContents.send(START_CHANGED, await state());
}

/** Register an app from an executable the user picked. */
async function addApp(): Promise<void> {
  if (!window) return;
  const picked = await dialog.showOpenDialog(window, {
    title: "Add a Suite app",
    properties: ["openFile"],
  });
  const executable = picked.filePaths[0];
  if (picked.canceled || !executable) return;

  // A packaged Suite app ships its manifest beside its own executable, so the
  // record that knows the binary knows where to read what it is.
  const manifestPath = join(dirname(executable), "suite.app.json");
  let record: InstallRecord = { executable, id: "", manifestPath };
  try {
    const text = await nodeRegistryFileSystem().readText(manifestPath);
    const parsed: unknown = JSON.parse(text);
    const id = (parsed as { id?: unknown }).id;
    if (typeof id !== "string" || id.length === 0) throw new Error("no id");
    record = { ...record, id, installedAt: new Date().toISOString() };
  } catch {
    await dialog.showMessageBox(window, {
      type: "error",
      title: "Not a Suite app",
      message:
        "That executable has no suite.app.json beside it, so Start cannot tell what it is. " +
        "Pick an application installed by Suite.",
    });
    return;
  }

  await registry.add(record);
  await broadcast();
}

function createWindow(): BrowserWindow {
  const created = new BrowserWindow({
    width: 880,
    height: 620,
    minWidth: 560,
    minHeight: 420,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: join(appDir(), "dist", "preload", "index.cjs"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  created.once("ready-to-show", () => created.show());
  created.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  created.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("start://launcher/")) event.preventDefault();
  });
  created.on("closed", () => {
    window = null;
  });
  return created;
}

async function show(): Promise<void> {
  if (!window) return;
  await window.loadURL("start://launcher/index.html");
  await broadcast();
}

function registerIpc(): void {
  ipcMain.handle(START_IPC.listApps, () => state());

  ipcMain.handle(START_IPC.launch, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    const { apps } = await discover();
    const target = appById(apps, id);
    if (!target) return;
    spawnApp(target, []);
    await broadcast();
  });

  ipcMain.handle(START_IPC.addApp, () => addApp());

  ipcMain.handle(START_IPC.removeApp, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    await registry.remove(id);
    await broadcast();
  });

  ipcMain.handle(START_IPC.recents, async () => (await state()).recents);

  ipcMain.handle(START_IPC.forgetRecent, async (_event, path: unknown) => {
    if (typeof path !== "string") return;
    await recents.forget(path);
    await broadcast();
  });

  // The one channel that takes a path, and it takes it only to hand back
  // something the index already listed: containment is checked in main.
  ipcMain.handle(START_IPC.openFile, async (_event, path: unknown) => {
    if (typeof path !== "string") return;
    const folders = documentFolders().map((folder) => folder.path);
    if (!isInsideDocuments(path, folders)) return;
    await open(path);
  });

  ipcMain.handle(START_IPC.info, () => ({
    host: "start",
    version: app.getVersion(),
    platform: process.platform,
  }));
}

/** A target from argv, whether it is a file or a `suite://` link. */
function targetFromArgv(argv: readonly string[]): string | null {
  for (const argument of argv.slice(1)) {
    if (argument.startsWith("-")) continue;
    if (argument.startsWith("suite://") || argument.startsWith("suite-start://")) return argument;
    if (/[\\/]/u.test(argument) && /\.[A-Za-z0-9]+$/u.test(argument)) return argument;
  }
  return null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
    const target = targetFromArgv(argv);
    if (target) void open(target);
  });

  // Both are delivered before `ready`, so they are registered before it.
  app.on("open-file", (event, path) => {
    event.preventDefault();
    if (app.isReady() && window) {
      void open(path);
      return;
    }
    pendingTargets.push(path);
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    const parsed = parseDeepLink(url, { apps: ["start", "canvas", "planner", "budget"] });
    // A link to Start itself only brings the window forward; anything else is a
    // routing request, which is the whole reason Start owns the scheme.
    if (parsed.ok && parsed.value.app === "start") {
      if (window) {
        window.show();
        window.focus();
      }
      return;
    }
    if (app.isReady() && window) {
      void open(url);
      return;
    }
    pendingTargets.push(url);
  });

  void app.whenReady().then(async () => {
    dataDirectory = process.env.SUITE_START_DATA?.trim() || join(app.getPath("userData"));
    registry = registryStore(dataDirectory);
    recents = recentsFile(dataDirectory);
    app.setAppUserModelId("run.suite.start");

    protocol.handle("start", async (request) => {
      const relative = new URL(request.url).pathname.replace(/^\/+/u, "") || "index.html";
      const root = join(appDir(), "dist", "renderer");
      const file = resolve(join(root, relative));
      if (file !== root && !file.startsWith(`${root}/`)) {
        return new Response("not found", { status: 404 });
      }
      // `net.fetch`, not the global: only this one can read a file URL.
      const response = await net.fetch(pathToFileURL(file).toString());
      const headers = new Headers(response.headers);
      headers.set("Content-Security-Policy", CSP);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    });

    registerIpc();
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: "appMenu" },
        { role: "editMenu" },
        { role: "viewMenu" },
        { role: "windowMenu" },
      ]),
    );

    window = createWindow();
    await show();

    const coldStart = targetFromArgv(process.argv);
    if (coldStart) pendingTargets.push(coldStart);
    const first = pendingTargets.shift();
    if (first) await open(first);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        window = createWindow();
        void show();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

export { dataDirectory };
