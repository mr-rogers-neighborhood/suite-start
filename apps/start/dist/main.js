import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { appDocumentsFolder, parseDeepLink, SUITE_APPS, suiteDocumentsRoot, } from "@suite/contracts";
import { desktopCsp, isTrustedSender, resolveProtocolAsset } from "@suite/desktop";
import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, shell } from "electron";
import { appCards, fileCards } from "./cards.js";
import { indexDocuments, isInsideDocuments } from "./fileIndex.js";
import { StartHost } from "./host.js";
import { registryStore } from "./installs.js";
import { defaultRoots, nodeRegistryFileSystem } from "./nodeFileSystem.js";
import { RECENT_LIMIT, recentsFile } from "./recents.js";
import { appById, discoverApps } from "./registry.js";
import { checkFeed } from "./releaseFeed.js";
import { fromCheck, readReportedUpdate, } from "./reportedUpdate.js";
import { describeRouteRejection, routeLaunch } from "./route.js";
import { START_CHANGED, START_IPC, } from "./shared.js";
import { checkForUpdates } from "./updateCheck.js";
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
function appDir() {
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
let window = null;
let registry;
let recents;
let dataDirectory = "";
let syncHost = null;
/** Files and links handed over before the window exists. */
const pendingTargets = [];
function roots() {
    return defaultRoots(app.getPath("home"), process.platform);
}
/** The documents root, unless `SUITE_START_DOCUMENTS` replaces it for a test. */
function documentsRoot() {
    return suiteDocumentsRoot(process.platform, app.getPath("home"), process.env.SUITE_START_DOCUMENTS);
}
/**
 * Where each app keeps its machine-local state.
 *
 * The same roots `suitePaths` gives the app itself, so a report is read from the
 * place it was written. The documents override does not apply: an update report is
 * machine state, not a document.
 */
function updateLookup() {
    return {
        platform: process.platform,
        home: app.getPath("home"),
        xdgDataHome: process.env.XDG_DATA_HOME,
    };
}
function documentFolders() {
    const platform = process.platform;
    const home = app.getPath("home");
    const rootOverride = process.env.SUITE_START_DOCUMENTS;
    return SUITE_APPS.map((entry) => ({
        app: entry,
        path: appDocumentsFolder(entry, {
            platform,
            home,
            rootOverride,
            xdgDataHome: process.env.XDG_DATA_HOME,
        }),
    }));
}
async function discover() {
    const result = await discoverApps({
        roots: roots(),
        records: await registry.list(),
        fileSystem: nodeRegistryFileSystem(),
    });
    return { apps: result.apps, refused: result.rejected };
}
/**
 * Answers from checks this session ran, by app id.
 *
 * Only a check a person asked for lands here, and only for the life of the window:
 * a cached answer that outlives the question becomes a claim nobody made.
 */
const checkedUpdates = new Map();
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
function syncPort() {
    const raw = process.env.SUITE_START_SYNC_PORT?.trim();
    const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535 ? parsed : 8787;
}
function syncState() {
    if (syncHost === null) {
        return { running: false, scope: "loopback", address: null, port: 8787, workspaces: [] };
    }
    return syncHost.state();
}
async function state() {
    const { apps, refused } = await discover();
    const recent = await recents.list();
    const files = await indexDocuments(documentFolders(), nodeRegistryFileSystem(), new Set(apps.map((entry) => entry.manifest.id)));
    // Each app reports its own update state; the hub reads it and asks nothing.
    const updates = new Map();
    await Promise.all(apps.map(async (entry) => {
        const checked = checkedUpdates.get(entry.manifest.id);
        updates.set(entry.manifest.id, checked ??
            (await readReportedUpdate(entry.manifest.id, updateLookup(), nodeRegistryFileSystem())));
    }));
    const cards = appCards({
        apps,
        rejected: refused,
        files,
        recents: recent,
        updates,
    });
    const recentCards = recent
        .flatMap((row) => {
        const owner = apps.find((entry) => entry.manifest.id === row.appId);
        if (!owner)
            return [];
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
        settings: { dataDirectory, documentsRoot: documentsRoot(), installRoots: roots() },
        version: app.getVersion(),
        sync: syncState(),
    };
}
/**
 * Start a process and let go of it.
 *
 * Detached, no inherited stdio, and `unref`, so an app outlives the launcher in
 * the same way a browser tab outlives the window that opened it.
 */
function spawnApp(app_, argv) {
    const child = spawn(app_.executable, [...argv], { detached: true, stdio: "ignore" });
    child.unref();
}
/** Resolve one target and start the app that owns it. */
async function open(target) {
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
async function broadcast() {
    if (!window)
        return;
    window.webContents.send(START_CHANGED, await state());
}
/** Register an app from an executable the user picked. */
async function addApp() {
    if (!window)
        return;
    const picked = await dialog.showOpenDialog(window, {
        title: "Add a Suite app",
        properties: ["openFile"],
    });
    const executable = picked.filePaths[0];
    if (picked.canceled || !executable)
        return;
    // A packaged Suite app ships its manifest beside its own executable, so the
    // record that knows the binary knows where to read what it is.
    const manifestPath = join(dirname(executable), "suite.app.json");
    let record = { executable, id: "", manifestPath };
    try {
        const text = await nodeRegistryFileSystem().readText(manifestPath);
        const parsed = JSON.parse(text);
        const id = parsed.id;
        if (typeof id !== "string" || id.length === 0)
            throw new Error("no id");
        record = { ...record, id, installedAt: new Date().toISOString() };
    }
    catch {
        await dialog.showMessageBox(window, {
            type: "error",
            title: "Not a Suite app",
            message: "That executable has no suite.app.json beside it, so Start cannot tell what it is. " +
                "Pick an application installed by Suite.",
        });
        return;
    }
    await registry.add(record);
    await broadcast();
}
function createWindow() {
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
        if (url.startsWith("https://") || url.startsWith("http://"))
            void shell.openExternal(url);
        return { action: "deny" };
    });
    created.webContents.on("will-navigate", (event, url) => {
        if (!url.startsWith("start://launcher/"))
            event.preventDefault();
    });
    created.on("closed", () => {
        window = null;
    });
    return created;
}
async function show() {
    if (!window)
        return;
    await window.loadURL("start://launcher/index.html");
    await broadcast();
}
/**
 * Register a channel, but only answer the page this app loaded.
 *
 * A sandboxed renderer with a strict policy is already a narrow door; this is
 * the check Electron's checklist asks for, and it costs one comparison.
 */
function onIpc(channel, handler) {
    ipcMain.handle(channel, (event, ...args) => {
        if (!isTrustedSender(event.senderFrame?.url, [PAGE_ORIGIN]))
            return undefined;
        return handler(event, ...args);
    });
}
function registerIpc() {
    onIpc(START_IPC.listApps, () => state());
    onIpc(START_IPC.launch, async (_event, id) => {
        if (typeof id !== "string")
            return;
        const { apps } = await discover();
        const target = appById(apps, id);
        if (!target)
            return;
        spawnApp(target, []);
        await broadcast();
    });
    onIpc(START_IPC.addApp, () => addApp());
    onIpc(START_IPC.removeApp, async (_event, id) => {
        if (typeof id !== "string")
            return;
        await registry.remove(id);
        await broadcast();
    });
    onIpc(START_IPC.recents, async () => (await state()).recents);
    onIpc(START_IPC.forgetRecent, async (_event, path) => {
        if (typeof path !== "string")
            return;
        await recents.forget(path);
        await broadcast();
    });
    // The one channel that takes a path, and it takes it only to hand back
    // something the index already listed: containment is checked in main.
    onIpc(START_IPC.openFile, async (_event, path) => {
        if (typeof path !== "string")
            return;
        const folders = documentFolders().map((folder) => folder.path);
        if (!isInsideDocuments(path, folders))
            return;
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
        await broadcast();
        return syncState();
    });
    onIpc(START_IPC.stopSync, async () => {
        await syncHost?.stop();
        await broadcast();
        return syncState();
    });
    onIpc(START_IPC.setSyncScope, async (_event, scope) => {
        if (scope !== "loopback" && scope !== "network")
            return syncState();
        syncHost ??= new StartHost({ dataDir: dataDirectory, port: syncPort() });
        await syncHost.setScope(scope);
        await broadcast();
        return syncState();
    });
    onIpc(START_IPC.checkUpdates, async () => {
        const { apps } = await discover();
        await Promise.all(apps.map(async (entry) => {
            const feed = entry.manifest.update?.feed;
            if (feed === undefined)
                return;
            const check = await checkFeed(feed, process.platform, (url) => fetch(url));
            const merged = fromCheck(entry.manifest.version, check);
            if (merged.source === "check")
                checkedUpdates.set(entry.manifest.id, merged);
        }));
        await broadcast();
    });
    onIpc(START_IPC.info, () => ({
        host: "start",
        version: app.getVersion(),
        platform: process.platform,
    }));
}
/** A target from argv, whether it is a file or a `suite://` link. */
function targetFromArgv(argv) {
    for (const argument of argv.slice(1)) {
        if (argument.startsWith("-"))
            continue;
        if (argument.startsWith("suite://") || argument.startsWith("suite-start://"))
            return argument;
        if (/[\\/]/u.test(argument) && /\.[A-Za-z0-9]+$/u.test(argument))
            return argument;
    }
    return null;
}
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
}
else {
    app.on("second-instance", (_event, argv) => {
        if (window) {
            if (window.isMinimized())
                window.restore();
            window.focus();
        }
        const target = targetFromArgv(argv);
        if (target)
            void open(target);
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
        await syncHost.start().catch((error) => {
            console.warn("[sync] the host did not start", error);
        });
        // The hub owns `suite://`; every other app is reached through it. An
        // installed package declares the scheme in its desktop entry, an AppImage
        // does not, so ask the platform once when packaged.
        if (app.isPackaged) {
            try {
                app.setAsDefaultProtocolClient("suite");
            }
            catch {
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
            if (!resolved.ok)
                return new Response("not found", { status: 404 });
            // `net.fetch`, not the global: only this one can read a file URL.
            const response = await net.fetch(pathToFileURL(resolved.file).toString());
            const headers = new Headers(response.headers);
            headers.set("Content-Security-Policy", CSP);
            headers.set("X-Content-Type-Options", "nosniff");
            return new Response(response.body, { status: response.status, headers });
        });
        registerIpc();
        Menu.setApplicationMenu(Menu.buildFromTemplate([
            { role: "appMenu" },
            { role: "editMenu" },
            { role: "viewMenu" },
            { role: "windowMenu" },
        ]));
        window = createWindow();
        await show();
        // The hub updates itself like any app: its own feed, its own report. A dev run
        // has no feed, so it does not ask.
        void checkForUpdates({
            dataDir: dataDirectory,
            version: app.getVersion(),
            channel: "alpha",
            packaged: app.isPackaged,
        }).then(({ error }) => {
            if (error !== null && app.isPackaged)
                console.warn(`[update] ${error}`);
        });
        const coldStart = targetFromArgv(process.argv);
        if (coldStart)
            pendingTargets.push(coldStart);
        const first = pendingTargets.shift();
        if (first)
            await open(first);
        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                window = createWindow();
                void show();
            }
        });
    });
    app.on("before-quit", () => {
        void syncHost?.stop();
    });
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin")
            app.quit();
    });
}
export { dataDirectory };
//# sourceMappingURL=main.js.map