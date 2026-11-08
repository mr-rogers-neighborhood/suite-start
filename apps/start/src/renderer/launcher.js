/*
 * The hub, as a page.
 *
 * Plain DOM and no framework: everything installed here would be a dependency
 * the hub carries into the apps it is meant to stay out of.
 *
 * It renders what the main process reports and nothing else.
 */
import { renderApps } from "./apps.js";
import { renderFiles } from "./files.js";
import { installRail } from "./rail.js";
import { renderSettings } from "./settings.js";
import { renderSync } from "./sync.js";

const bridge = globalThis.suiteStart;

const actions = {
  async launch(id) {
    await bridge.launch(id);
    await refresh();
  },
  /**
   * Install or update one app.
   *
   * The call resolves when the app is on disk, but the card is redrawn from what arrives
   * while it runs — the bar is the answer, not the await.
   */
  async install(id) {
    await bridge.installApp(id);
    await refresh();
  },
  async remove(id) {
    await bridge.removeApp(id);
    await refresh();
  },
  async uninstall(id) {
    await bridge.uninstallApp(id);
    await refresh();
  },
  /**
   * Back to the version the last update replaced.
   *
   * No confirmation dialog: nothing is deleted, and the version it leaves stays on disk, so
   * the undo is the same button again. A prompt in front of a reversible action teaches
   * people to dismiss prompts.
   */
  async rollback(id) {
    await bridge.rollbackApp(id);
    await refresh();
  },
  /**
   * Which palette to draw.
   *
   * The next state arrives carrying the answer, so the select keeps whatever was chosen
   * rather than snapping back to a value the page guessed.
   */
  async setTheme(source) {
    await bridge.setTheme(source);
    await refresh();
  },
  async reveal(id) {
    await bridge.revealApp(id);
  },
  async openRecent(recent) {
    await bridge.launch(recent.appId);
    await refresh();
  },
  async openFile(path) {
    await bridge.openFile(path);
    await refresh();
  },
  /**
   * Put a document's link on the clipboard.
   *
   * The clipboard belongs to the page rather than to the hub: it is one async
   * call, the page is a secure origin, and a channel that writes the system
   * clipboard in main would be a capability for nothing.
   */
  async startSync() {
    await bridge.startSync();
    await refresh();
  },
  async stopSync() {
    await bridge.stopSync();
    await refresh();
  },
  async setSyncScope(scope) {
    await bridge.setSyncScope(scope);
    await refresh();
  },
  async copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  },
};

/** The last thing main said, so a progress event can redraw the cards alone. */
let lastState = null;

/** The Apps filter, so a list of nine still behaves like a list of three. */
let appFilter = "";

function visibleApps(state) {
  if (appFilter.trim().length === 0) return state;
  const wanted = appFilter.trim().toLowerCase();
  return {
    ...state,
    apps: state.apps.filter((app) => app.name.toLowerCase().includes(wanted)),
  };
}

function render(state) {
  lastState = state;
  renderApps(visibleApps(state), actions);
  renderFiles(state, actions);
  renderSettings(state, actions);
  renderSync(state, actions);
  document.getElementById("version").textContent = `Suite ${state.version}`;

  // The chosen palette, or none at all so the stylesheet's media query answers. Set from
  // state rather than from the control, so a choice made in one window is right in the next.
  const chosen = state.settings.theme;
  if (chosen === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = chosen;

  // The rail carries the one number worth acting on, and hides it at zero so a
  // healthy hub is quiet.
  const attention = state.apps.filter((app) => !app.health.ok).length;
  const badge = document.getElementById("count-apps");
  badge.hidden = attention === 0;
  badge.textContent = String(attention);
  badge.setAttribute("aria-label", `${attention} needing attention`);
}

async function refresh() {
  render(await bridge.listApps());
}

if (typeof bridge !== "object" || bridge === null) {
  document.querySelector(".content").textContent =
    "Start's shell did not load, so this window cannot list anything. Restart Suite.";
} else {
  const rail = installRail();
  bridge.onChanged?.(render);

  // Cmd/Ctrl+1..4 reach the pane with the same number a person sees in the rail.
  const tabs = ["apps", "files", "sync", "settings"];
  globalThis.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const index = Number.parseInt(event.key, 10) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= tabs.length) return;
    event.preventDefault();
    rail.select(index);
  });

  // A bar moves far more often than anything else in this window changes, so it arrives
  // on its own channel and redraws only the cards.
  bridge.onInstallProgress?.((installing) => {
    if (lastState === null) return;
    lastState = { ...lastState, installing };
    renderApps(visibleApps(lastState), actions);
  });

  document.getElementById("add").addEventListener("click", async () => {
    await bridge.addApp();
    await refresh();
  });

  // On demand: one request per app that names a feed, and nothing on a timer.
  // The answer arrives as a broadcast, so the page re-reads rather than guessing.
  const check = document.getElementById("check-updates");
  check.addEventListener("click", async () => {
    check.disabled = true;
    check.textContent = "Checking…";
    try {
      await bridge.checkUpdates();
    } finally {
      check.disabled = false;
      check.textContent = "Check for updates";
    }
  });

  // The host's rooms change without Start knowing, so the pane re-reads when it is
  // opened rather than showing a snapshot from whenever the window last drew.
  document.getElementById("tab-sync").addEventListener("click", () => void refresh());

  const search = document.getElementById("app-search");
  search?.addEventListener("input", () => {
    appFilter = search.value;
    if (lastState !== null) render(lastState);
  });

  // A launch Start initiated changes what is recent, so the window re-reads
  // rather than trusting what it already drew.
  globalThis.addEventListener("focus", () => void refresh());

  void refresh();
}
