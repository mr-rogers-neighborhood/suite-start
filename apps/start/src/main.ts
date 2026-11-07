import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  appDocumentsFolder,
  hubReportPath,
  parseDeepLink,
  SUITE_APPS,
  type SuiteAppEntry,
  type SuiteHub,
  suiteApplicationsRoot,
  suiteDocumentsRoot,
} from "@suite/contracts";
import {
  desktopCsp,
  feedUrlFromAppUpdateYml,
  isTrustedSender,
  resolveProtocolAsset,
} from "@suite/desktop";
import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, shell } from "electron";
import { appCards, fileCards, selfCard } from "./cards.js";
import {
  CATALOGUE_APPS,
  type CatalogueApp,
  type CatalogueEntry,
  readCatalogue,
  SELF_ID,
  withInstalled,
} from "./catalogue.js";
import { type DocumentsFolder, indexDocuments, isInsideDocuments } from "./fileIndex.js";
import { StartHost } from "./host.js";
import { writeHubReport } from "./hubReport.js";
import { installApp, installedVersions } from "./install.js";
import { type RegistryStore, registryStore } from "./installs.js";
import { launchVerdict } from "./launchCheck.js";
import { defaultRoots, nodeRegistryFileSystem } from "./nodeFileSystem.js";
import { RECENT_LIMIT, type RecentsFile, recentsFile } from "./recents.js";
import { type RecoveryLookup, readRecoveryReports, recoveryFor } from "./recovery.js";
import { appById, type DiscoveredApp, discoverApps, type InstallRecord } from "./registry.js";
import { type ReportedUpdate, readReportedUpdate, type UpdateLookup } from "./reportedUpdate.js";
import { describeRouteRejection, routeLaunch } from "./route.js";
import {
  type InstallProgress,
  type LauncherState,
  type RecentCard,
  START_CHANGED,
  START_INSTALL_PROGRESS,
  START_IPC,
  type SyncState,
} from "./shared.js";
import { shortcutIconName, shortcutIconPath, shortcutPath, shortcutText } from "./shortcuts.js";
import { checkForUpdates } from "./updateCheck.js";
import { resolveWindowIcon } from "./windowIcon.js";

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
// Before anything reads a path. `userData` is derived from the application name,
// and without this it is the scoped package name, `@suite/start`.
app.setName("Suite Start");

// A second profile needs its own Chromium directory: the single-instance lock
// lives in `userData`, so two hubs in one folder would close each other. This is
// also what lets a test run a hub without touching the real one.
const userDataOverride = process.env.SUITE_START_USER_DATA?.trim();
if (userDataOverride !== undefined && userDataOverride.length > 0) {
  app.setPath("userData", userDataOverride);
}

function appDir(): string {
  return app.getAppPath();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "start",
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

/**
 * The hub never runs WebAssembly, so it does not need the directive the apps
 * need. The rest of the policy is the one every Suite page ships.
 */
const CSP = desktopCsp({ wasm: false });

/** The only origin the hub's renderer is loaded from. */
const PAGE_ORIGIN = "start://launcher";

let window: BrowserWindow | null = null;
let registry: RegistryStore;
let recents: RecentsFile;
let dataDirectory = "";
let syncHost: StartHost | null = null;
/** The report already on disk, so a restart is visible as a new `startedAt` rather than a new one. */
let previousHub: SuiteHub | null = null;

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

/**
 * Where this hub puts an app it installs.
 *
 * `~/Applications/Suite` unless `SUITE_START_APPS_ROOT` says otherwise, which is how a
 * test installs into a directory it can throw away.
 */
function applicationsRoot(): string {
  return suiteApplicationsRoot(
    process.platform,
    app.getPath("home"),
    process.env.SUITE_START_APPS_ROOT,
  );
}

/**
 * A local feed, in place of the published ones. Empty when not set.
 *
 * A folder is accepted as well as a URL, and turned into one: nothing else in this
 * process can read a path, and the point of the seam is that a person can point it at
 * releases they built on their own machine.
 */
function feedBase(): string | undefined {
  const named = process.env.SUITE_START_FEED_BASE?.trim();
  if (named === undefined || named.length === 0) return undefined;
  return /^[a-z][a-z0-9+.-]*:\/\//iu.test(named) ? named : pathToFileURL(resolve(named)).toString();
}

/**
 * The hub's own feed, from the `app-update.yml` electron-builder writes beside a
 * packaged binary. A dev run has no such file, so its row says the build has no feed.
 */
async function selfFeed(): Promise<string | null> {
  if (!app.isPackaged) return null;
  try {
    return feedUrlFromAppUpdateYml(
      await readFile(join(process.resourcesPath, "app-update.yml"), "utf8"),
    );
  } catch {
    return null;
  }
}

/**
 * One request per feed, and none of them may hold the window.
 *
 * `net.fetch` rather than the global: it is the only one that can read a `file:` URL, and
 * a feed in a local folder is how an install is proven before anything is published. A
 * feed that hangs is a launcher that hangs if this had no ceiling; ten seconds is long
 * enough for a slow network and short enough to be a reason rather than a stall.
 */
function fetchFeed(url: string): Promise<Response> {
  return net.fetch(url, { signal: AbortSignal.timeout(10_000) });
}

/** The fetch an install should use, for the same reason as `fetchFeed`. */
const installFetch: typeof globalThis.fetch = (url, init) =>
  net.fetch(typeof url === "string" ? url : url.toString(), init);

/**
 * The apps Start has started and not seen exit, by app id.
 *
 * A pid, not a promise: a window Start did not spawn (from the menu, say) is not in here
 * and cannot be, and pretending otherwise would put a "Running" on a card nobody checked.
 */
const runningPids = new Map<string, number>();

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function liveRunning(): ReadonlySet<string> {
  const live = new Set<string>();
  for (const [id, pid] of runningPids) {
    if (isAlive(pid)) live.add(id);
    else runningPids.delete(id);
  }
  return live;
}

/** What the catalogue last answered, and what is being installed right now. */
let catalogue: readonly CatalogueApp[] = [];
const installProgress = new Map<string, InstallProgress>();

/**
 * Ask every feed what it offers.
 *
 * This runs when the window opens and when a person presses a button — never on a timer,
 * and it never downloads. A feed it cannot read becomes a sentence on the card rather
 * than a failure of the window.
 */
async function refreshCatalogue(): Promise<void> {
  const { apps } = await discover();
  catalogue = await readCatalogue({
    installed: new Map(apps.map((entry) => [entry.manifest.id, entry.manifest.version])),
    feedBase: feedBase(),
    selfFeed: await selfFeed(),
    fetch: fetchFeed,
  });
}

/** How many versions of each catalogue app are on disk here. One listing each. */
async function versionCounts(): Promise<ReadonlyMap<string, number>> {
  const counts = new Map<string, number>();
  const root = applicationsRoot();
  await Promise.all(
    CATALOGUE_APPS.map(async (entry) => {
      counts.set(entry.id, (await installedVersions(root, entry)).length);
    }),
  );
  return counts;
}

/** Send the progress list, which is the only thing that changes while a bar moves. */
function sendProgress(): void {
  window?.webContents.send(START_INSTALL_PROGRESS, [...installProgress.values()]);
}

function reportProgress(progress: InstallProgress): void {
  installProgress.set(progress.id, progress);
  sendProgress();
}

/**
 * Where each app keeps its machine-local state.
 *
 * The same roots `suitePaths` gives the app itself, so a report is read from the
 * place it was written. The documents override does not apply: an update report is
 * machine state, not a document.
 */
function updateLookup(): UpdateLookup {
  return {
    platform: process.platform,
    home: app.getPath("home"),
    xdgDataHome: process.env.XDG_DATA_HOME,
  };
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

/**
 * The host's state, or a stopped one before it exists.
 *
 * Start is the mailbox, not a member: it holds encrypted frames and the role records that
 * decide who may write, and it can show that without ever reading a document.
 */
/**
 * The port the host listens on.
 *
 * 8787 unless something says otherwise: a test needs a free port, and two hosts on one
 * machine would otherwise take turns failing to bind.
 */
function syncPort(): number {
  const raw = process.env.SUITE_START_SYNC_PORT?.trim();
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535 ? parsed : 8787;
}

/**
 * The sync pane's state, with the one thing the host cannot know.
 *
 * The host carries frames and knows who may write; whether anybody kept a way back in is a
 * fact about the apps on this machine, so it is read from their own reports and folded in
 * here rather than pretended to by the mailbox.
 */
async function syncState(): Promise<SyncState> {
  const host = syncHost?.state() ?? null;
  const reports = await readRecoveryReports(recoveryLookup(), nodeRegistryFileSystem());
  return {
    running: host?.running ?? false,
    scope: host?.scope ?? "loopback",
    address: host?.address ?? null,
    port: host?.port ?? 8787,
    workspaces: (host?.workspaces ?? []).map((workspace) => ({
      ...workspace,
      recovery: recoveryFor(reports, workspace.workspaceId),
    })),
  };
}

function recoveryLookup(): RecoveryLookup {
  return {
    platform: process.platform,
    home: app.getPath("home"),
    xdgDataHome: process.env.XDG_DATA_HOME,
  };
}

/**
 * Tell the other apps where this machine listens, in the one place they can read it.
 *
 * Written whenever the host changes, because a stale address is worse than none: an app that
 * prefilled a share field from a hub that has since stopped would hand out a link to nothing.
 */
async function reportHub(): Promise<void> {
  const state =
    syncHost === null
      ? { running: false, scope: "loopback" as const, address: null, port: syncPort() }
      : syncHost.state();
  const now = new Date().toISOString();
  const report: SuiteHub = {
    format: "suite.hub",
    running: state.running,
    scope: state.scope,
    port: state.port,
    address: state.address,
    startedAt: state.running
      ? previousHub?.running === true
        ? (previousHub.startedAt ?? now)
        : now
      : null,
    updatedAt: now,
  };
  previousHub = report;
  await writeHubReport(hubReportPath(recoveryLookup()), report);
}

async function state(): Promise<LauncherState> {
  const { apps, refused } = await discover();
  const recent = await recents.list();
  const files = await indexDocuments(
    documentFolders(),
    nodeRegistryFileSystem(),
    new Set(apps.map((entry) => entry.manifest.id)),
  );

  // What each app says about its own updating. Still read, because an app Start did not
  // install updates itself and the card should be able to say what it found.
  const updates = new Map<string, ReportedUpdate>();
  await Promise.all(
    apps.map(async (entry) => {
      updates.set(
        entry.manifest.id,
        await readReportedUpdate(entry.manifest.id, updateLookup(), nodeRegistryFileSystem()),
      );
    }),
  );

  const self = catalogue.find((entry) => entry.id === SELF_ID);
  const cards = appCards({
    apps,
    rejected: refused,
    files,
    recents: recent,
    updates,
    catalogue,
    versions: await versionCounts(),
    running: liveRunning(),
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
    files: fileCards(files),
    settings: {
      dataDirectory,
      documentsRoot: documentsRoot(),
      installRoots: [...new Set([...roots(), applicationsRoot()])],
    },
    version: app.getVersion(),
    sync: await syncState(),
    // The hub cannot replace its own running binary, so it says what it is rather than
    // offering a button that would fail.
    self: self === undefined ? null : selfCard(self, app.getVersion()),
    installing: [...installProgress.values()],
    launchErrors: Object.fromEntries(launchFailures),
  };
}

/**
 * The variable that tells an app it was started by the hub.
 *
 * An app launched this way leaves its own updating alone, because Start is the process
 * that downloads, verifies and replaces it (D45). A copy run from a folder gets no such
 * promise and keeps its own updater — which is what the release notes have always said.
 */
const MANAGED_BY_ENV = "SUITE_MANAGED_BY";

/**
 * Launch failures, by app id, since the window opened.
 *
 * A launch is not an install, so this is not `installProgress`: it is a sentence the card
 * shows until the next successful launch. Kept in memory only, because a failure that
 * outlived the session would be a claim about a launch nobody just made.
 */
const launchFailures = new Map<string, string>();

/**
 * Start a process and let go of it — watching the first moment before letting go.
 *
 * Detached, `unref`, and output discarded, so an app outlives the launcher the way a
 * browser tab outlives the window that opened it. The cost of discarding output is that a
 * binary which dies immediately is indistinguishable from one that opened and stayed:
 * the card still says Open and nothing moved. So stderr is kept for the first second and
 * a half, which is long enough to catch a missing library and short enough to stay
 * invisible for an app that started.
 *
 * A failure to mount is retried once with `APPIMAGE_EXTRACT_AND_RUN=1` instead of being
 * reported. The person pressed Open; they did not ask to learn about FUSE.
 */
function spawnExecutable(executable: string, argv: readonly string[], appId?: string): void {
  const child = spawn(executable, [...argv], {
    detached: true,
    stdio: ["ignore", "ignore", "pipe"],
    // The app is being started by the thing that also updates it. Only a launch Start
    // performs carries this; a desktop entry or a shell run does not.
    env: appId === undefined ? process.env : { ...process.env, [MANAGED_BY_ENV]: "start" },
  });

  let stderr = "";
  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (chunk: string) => {
    if (stderr.length < 8192) stderr += chunk;
  });

  if (appId !== undefined && child.pid !== undefined) runningPids.set(appId, child.pid);

  let settled = false;
  const settle = (): void => {
    settled = true;
    child.stderr?.removeAllListeners("data");
    child.stderr?.destroy();
    child.unref();
    if (appId !== undefined && launchFailures.delete(appId)) void broadcast();
  };
  setTimeout(settle, 1_500);

  // Always: a window that closes is news even if it opened fine, because the card says
  // "running" and nobody else is going to redraw it.
  child.once("exit", () => {
    if (appId !== undefined && runningPids.get(appId) === child.pid) {
      runningPids.delete(appId);
      void broadcast();
    }
  });

  child.once("exit", (code) => {
    if (settled) return;
    settled = true;
    const verdict = launchVerdict({ executable, exitCode: code, stderr });

    if (verdict.kind === "retry-without-fuse") {
      console.warn(`[launch] ${executable}: ${verdict.reason}; retrying without FUSE 2`);
      spawn(executable, [...argv], {
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          APPIMAGE_EXTRACT_AND_RUN: "1",
          ...(appId === undefined ? {} : { [MANAGED_BY_ENV]: "start" }),
        },
      }).unref();
      child.unref();
      return;
    }

    child.unref();
    if (appId === undefined || verdict.kind === "ok") return;
    console.warn(`[launch] ${executable}: ${verdict.reason}`);
    launchFailures.set(appId, verdict.reason);
    void broadcast();
  });
}

function spawnApp(app_: DiscoveredApp, argv: readonly string[]): void {
  spawnExecutable(app_.executable, argv, app_.manifest.id);
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

/** Where a user-scope application entry lives, and where its icon goes. */
function shortcutDirs(): { entry: (id: string) => string; icon: (name: string) => string } {
  const platform = process.platform;
  const home = app.getPath("home");
  return {
    entry: (id) => shortcutPath(platform, home, id),
    icon: (name) => shortcutIconPath(platform, home, name),
  };
}

/**
 * Write (or rewrite) the menu entry for a managed install.
 *
 * The entry names the versioned executable, so an update has to rewrite it — which is why
 * it is one file per app rather than one per version. Failure is a warning, never a failed
 * install: a missing menu entry is a smaller problem than an app that will not install.
 */
async function writeShortcut(entry: CatalogueEntry, executable: string): Promise<void> {
  const dirs = shortcutDirs();
  const iconName = shortcutIconName(entry.id);
  try {
    const iconSource = windowIcon();
    if (iconSource !== null) {
      const destination = dirs.icon(iconName);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(iconSource, destination);
    }
    const path = dirs.entry(entry.id);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(
      path,
      shortcutText({
        id: entry.id,
        name: entry.name,
        executable,
        extensions: [...entry.extensions],
        iconName,
      }),
    );
    // Best effort: the cache is a convenience, and a machine without the tool still finds
    // a freshly written file on its next scan.
    const refresh = spawn("update-desktop-database", [dirname(path)], { stdio: "ignore" });
    refresh.on("error", () => undefined);
    refresh.unref();
  } catch (error) {
    console.warn(`[shortcut] could not write the entry for ${entry.id}`, error);
  }
}

/** Remove an app's entry and icon. Best effort, for the same reason as writing them. */
async function removeShortcut(id: string): Promise<void> {
  const dirs = shortcutDirs();
  await rm(dirs.entry(id), { force: true }).catch(() => undefined);
  await rm(dirs.icon(shortcutIconName(id)), { force: true }).catch(() => undefined);
}

/**
 * Ask an app Start started to close, and wait a moment for it.
 *
 * SIGTERM first, because that is a request an app can answer — a document can be flushed.
 * The caller decides what to do if it is still there afterwards; this never escalates on
 * its own.
 */
function stopApp(id: string): void {
  const pid = runningPids.get(id);
  if (pid === undefined) return;
  try {
    process.kill(pid, 0);
    process.kill(pid, "SIGTERM");
  } catch {
    // Already gone: the map is stale, which the next `liveRunning` clears.
  }
}

/** Wait until a pid is gone, or give up. Returns whether it went. */
async function waitForExit(id: string, timeoutMs = 5_000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pid = runningPids.get(id);
    if (pid === undefined || !isAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

/** The sentence a failed install shows, which is what the step that failed wrote. */
function describeInstallFailure(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "the install did not finish, and nothing was replaced";
}

/**
 * Install or update one app, and let the card watch it happen.
 *
 * The artifact is downloaded to a staging directory, checked against the fingerprint the
 * verified manifest named, and only then placed. So a download that fails, or a file that
 * is not the one the publisher signed, leaves the previous install exactly as it was.
 */
async function installOne(id: string): Promise<void> {
  const entry = catalogue.find((app) => app.id === id);
  if (entry === undefined) return;

  if (entry.available === null || entry.artifact === null) {
    reportProgress({
      id,
      phase: "failed",
      received: 0,
      total: null,
      reason: entry.reason ?? "the feed named no file to install",
    });
    return;
  }

  const artifact = entry.artifact;
  const version = entry.available;
  // An update replaces a version this machine already has, and finishes by relaunching it.
  const updating = entry.installed !== null && entry.installed !== version;

  // Replacing the bytes under a live process is legal on Linux and rude in practice: the
  // window a person is using would keep running the old image until they closed it. So an
  // app Start started is closed first, by asking.
  if (runningPids.has(id) && window !== null) {
    const answer = await dialog.showMessageBox(window, {
      type: "question",
      title: "Update",
      message: `Close ${entry.name} and update it to ${version}?`,
      detail: "It will be reopened when the new version is in place.",
      buttons: ["Cancel", "Close and update"],
      defaultId: 1,
      cancelId: 0,
    });
    if (answer.response !== 1) return;

    stopApp(id);
    if (!(await waitForExit(id))) {
      reportProgress({
        id,
        phase: "failed",
        received: 0,
        total: null,
        reason: `${entry.name} did not close, so nothing was replaced`,
      });
      return;
    }
  }
  let emitted = { at: 0, percent: -1 };
  reportProgress({ id, phase: "downloading", received: 0, total: artifact.size, reason: null });

  try {
    const installed = await installApp({
      entry,
      version,
      artifact,
      feed: entry.feed,
      appsRoot: applicationsRoot(),
      registry,
      fetch: installFetch,
      prune: updating,
      onProgress: (received, total) => {
        const percent = total === null || total === 0 ? -1 : Math.floor((received / total) * 100);
        const at = Date.now();
        // A bar does not need every chunk, and the window is not the thing being written.
        if (percent === emitted.percent && at - emitted.at < 500) return;
        emitted = { at, percent };
        reportProgress({ id, phase: "downloading", received, total, reason: null });
      },
    });

    installProgress.delete(id);
    sendProgress();
    await writeShortcut(entry, installed.executable);
    // The feed answer is still the last check's; only what is on disk changed.
    catalogue = withInstalled(catalogue, id, installed.version);
    await broadcast();
    // A replace should finish where it started: the app a person was using is running
    // again, from the version they just agreed to.
    if (updating) spawnExecutable(installed.executable, []);
  } catch (error) {
    reportProgress({
      id,
      phase: "failed",
      received: 0,
      total: null,
      reason: describeInstallFailure(error),
    });
  }
}

/** Read the feeds again and redraw, which is what the menu item and the button both do. */
async function refreshAndBroadcast(): Promise<void> {
  for (const [id, progress] of installProgress) {
    if (progress.phase === "failed") installProgress.delete(id);
  }
  await refreshCatalogue().catch((error: unknown) => {
    console.warn("[catalogue] the feeds could not be read", error);
  });
  sendProgress();
  await broadcast();
}

/** Open one of Start's own folders, rather than a path a page asked for. */
async function openFolder(path: string): Promise<void> {
  const problem = await shell.openPath(path);
  if (problem.length > 0 && window !== null) {
    await dialog.showMessageBox(window, {
      type: "warning",
      title: "Suite Start",
      message: `That folder could not be opened: ${problem}`,
    });
  }
}

/** The window's own icon: a different source from the desktop entry's (§windowIcon). */
function windowIcon(): string | null {
  const icon = resolveWindowIcon({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appPath: appDir(),
    exists: (path) => existsSync(path),
  });
  if (icon === null) console.warn("[start] no window icon to load");
  else if (icon.reason !== null) console.warn(`[start] ${icon.reason}; using ${icon.path}`);
  return icon?.path ?? null;
}

function createWindow(): BrowserWindow {
  const icon = windowIcon();
  const created = new BrowserWindow({
    width: 880,
    height: 620,
    minWidth: 560,
    minHeight: 420,
    show: false,
    backgroundColor: "#ffffff",
    ...(icon === null ? {} : { icon }),
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

/**
 * Register a channel, but only answer the page this app loaded.
 *
 * A sandboxed renderer with a strict policy is already a narrow door; this is
 * the check Electron's checklist asks for, and it costs one comparison.
 */
function onIpc(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown,
): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event.senderFrame?.url, [PAGE_ORIGIN])) return undefined;
    return handler(event, ...args);
  });
}

function registerIpc(): void {
  onIpc(START_IPC.listApps, () => state());

  onIpc(START_IPC.launch, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    const { apps } = await discover();
    const target = appById(apps, id);
    if (!target) return;
    spawnApp(target, []);
    await broadcast();
  });

  onIpc(START_IPC.addApp, () => addApp());

  /**
   * Install or update one app, with the card watching.
   *
   * Every step here is the person's: the feed was read because the window opened or
   * because they asked it to look again, and this runs only because they pressed the
   * button the card drew.
   */
  onIpc(START_IPC.installApp, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    await installOne(id);
  });

  onIpc(START_IPC.removeApp, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    // A refusal that cannot be launched leaves a record and nothing else to delete.
    await registry.remove(id);
    await removeShortcut(id);
    await broadcast();
  });

  /**
   * Show a copy Start did not install, where it lives.
   *
   * The page names an app, never a path: main looks the executable up in its own records,
   * which is the only place an executable path exists for a launch or a reveal.
   */
  onIpc(START_IPC.revealApp, async (_event, id: unknown) => {
    if (typeof id !== "string") return;
    const { apps } = await discover();
    const target = appById(apps, id);
    if (target === null) return;
    shell.showItemInFolder(target.executable);
  });

  /**
   * Uninstall: remove what Start installed, and forget it.
   *
   * "Remove" that leaves two hundred megabytes behind is a lie by omission, so this is the
   * only removal a card offers for a managed install — with one dialog that names what
   * goes. A copy Start did not place is not Start's to delete, and keeps the forget path.
   */
  onIpc(START_IPC.uninstallApp, async (_event, id: unknown) => {
    if (typeof id !== "string" || window === null) return;
    const entry = CATALOGUE_APPS.find((candidate) => candidate.id === id);
    if (entry === undefined) return;

    const versions = await installedVersions(applicationsRoot(), entry);
    const answer = await dialog.showMessageBox(window, {
      type: "warning",
      title: "Uninstall",
      message: `Uninstall ${entry.name}?`,
      detail:
        versions.length === 0
          ? "No files are installed here; this only forgets the app."
          : `This deletes ${versions.length} version${versions.length === 1 ? "" : "s"} ` +
            `from ${applicationsRoot()}/${entry.folder}, its menu entry, and its install ` +
            "record. Documents are not touched.",
      buttons: ["Cancel", "Uninstall"],
      defaultId: 0,
      cancelId: 0,
    });
    if (answer.response !== 1) return;

    if (runningPids.has(id)) {
      stopApp(id);
      await waitForExit(id);
      runningPids.delete(id);
    }
    await rm(join(applicationsRoot(), entry.folder), { recursive: true, force: true });
    catalogue = withInstalled(catalogue, id, null);
    await removeShortcut(id);
    await registry.remove(id);
    await broadcast();
  });

  onIpc(START_IPC.recents, async () => (await state()).recents);

  onIpc(START_IPC.forgetRecent, async (_event, path: unknown) => {
    if (typeof path !== "string") return;
    await recents.forget(path);
    await broadcast();
  });

  // The one channel that takes a path, and it takes it only to hand back
  // something the index already listed: containment is checked in main.
  onIpc(START_IPC.openFile, async (_event, path: unknown) => {
    if (typeof path !== "string") return;
    const folders = documentFolders().map((folder) => folder.path);
    if (!isInsideDocuments(path, folders)) return;
    await open(path);
  });

  /**
   * Ask each app's feed whether something newer exists.
   *
   * On demand, one request per app, and nothing is written: the answer is a
   * reading, and installing remains the app's business.
   */
  onIpc(START_IPC.startSync, async () => {
    syncHost ??= new StartHost({ dataDir: dataDirectory, port: syncPort() });
    await syncHost.start();
    await reportHub().catch((error: unknown) => {
      console.warn("[sync] could not report the hub's address", error);
    });
    await broadcast();
    return syncState();
  });

  onIpc(START_IPC.stopSync, async () => {
    await syncHost?.stop();
    await reportHub().catch((error: unknown) => {
      console.warn("[sync] could not report the hub's address", error);
    });
    await broadcast();
    return syncState();
  });

  onIpc(START_IPC.setSyncScope, async (_event, scope: unknown) => {
    if (scope !== "loopback" && scope !== "network") return syncState();
    syncHost ??= new StartHost({ dataDir: dataDirectory, port: syncPort() });
    await syncHost.setScope(scope);
    await reportHub().catch((error: unknown) => {
      console.warn("[sync] could not report the hub's address", error);
    });
    await broadcast();
    return syncState();
  });

  onIpc(START_IPC.checkUpdates, () => refreshAndBroadcast());

  onIpc(START_IPC.info, () => ({
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

    // The mailbox is up whenever Start is: a host that needed a second switch would be a
    // host nobody turned on. Loopback until somebody widens it.
    syncHost = new StartHost({ dataDir: dataDirectory, port: syncPort() });
    await syncHost.start().catch((error: unknown) => {
      console.warn("[sync] the host did not start", error);
    });
    // Before the window opens: an app that reads this at launch should find today's answer.
    await reportHub().catch((error: unknown) => {
      console.warn("[sync] could not report the hub's address", error);
    });

    // The hub owns `suite://`; every other app is reached through it. An
    // installed package declares the scheme in its desktop entry, an AppImage
    // does not, so ask the platform once when packaged.
    if (app.isPackaged) {
      try {
        app.setAsDefaultProtocolClient("suite");
      } catch {
        // No desktop integration available; the file manager path still works.
      }
    }

    protocol.handle("start", async (request) => {
      const root = join(appDir(), "dist", "renderer");
      // The shared resolver reads the raw URL and refuses a climb before the
      // URL parser can normalise it away.
      const resolved = resolveProtocolAsset(request.url, root, {
        scheme: "start",
        hosts: ["launcher"],
      });
      if (!resolved.ok) return new Response("not found", { status: 404 });
      // `net.fetch`, not the global: only this one can read a file URL.
      const response = await net.fetch(pathToFileURL(resolved.file).toString());
      const headers = new Headers(response.headers);
      headers.set("Content-Security-Policy", CSP);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    });

    registerIpc();
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        // A launcher's menu carries the launcher's verbs; the standard roles stay because
        // a window without Edit is a window people notice.
        {
          label: app.name,
          submenu: [
            { label: "Check for Updates", click: () => void refreshAndBroadcast() },
            { label: "Add App…", click: () => void addApp() },
            { type: "separator" },
            { label: "Open Applications Folder", click: () => void openFolder(applicationsRoot()) },
            { label: "Open Data Folder", click: () => void openFolder(dataDirectory) },
            { type: "separator" },
            { role: "quit" },
          ],
        },
        { role: "editMenu" },
        { role: "viewMenu" },
        { role: "windowMenu" },
      ]),
    );

    window = createWindow();
    await show();

    // The window is up before any feed is read, so a slow network delays a card rather
    // than the launcher. What arrives is broadcast, and the cards redraw.
    await refreshCatalogue().catch((error: unknown) => {
      console.warn("[catalogue] the feeds could not be read", error);
    });
    await broadcast();

    // The hub updates itself like any app: its own feed, its own report. A dev run
    // has no feed, so it does not ask.
    void checkForUpdates({
      dataDir: dataDirectory,
      version: app.getVersion(),
      channel: "alpha",
      packaged: app.isPackaged,
    }).then(({ error }) => {
      if (error !== null && app.isPackaged) console.warn(`[update] ${error}`);
    });

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

  app.on("before-quit", () => {
    // Best effort: a report that says the hub is still up would be a lie a reader acts on.
    void syncHost
      ?.stop()
      .then(() => reportHub())
      .catch(() => undefined);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

export { dataDirectory };
