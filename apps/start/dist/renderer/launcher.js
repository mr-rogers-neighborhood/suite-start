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

const bridge = globalThis.suiteStart;

const actions = {
  async launch(id) {
    await bridge.launch(id);
    await refresh();
  },
  async remove(id) {
    await bridge.removeApp(id);
    await refresh();
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
  async copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  },
};

function render(state) {
  renderApps(state, actions);
  renderFiles(state, actions);
  renderSettings(state);
  document.getElementById("version").textContent = `Suite ${state.version}`;

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
  installRail();
  bridge.onChanged?.(render);

  document.getElementById("add").addEventListener("click", async () => {
    await bridge.addApp();
    await refresh();
  });

  // A launch Start initiated changes what is recent, so the window re-reads
  // rather than trusting what it already drew.
  globalThis.addEventListener("focus", () => void refresh());

  void refresh();
}
