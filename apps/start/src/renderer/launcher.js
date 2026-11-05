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
};

function render(state) {
  renderApps(state, actions);
  renderFiles(state, actions);
  renderSettings(state);
  document.getElementById("version").textContent = `Suite ${state.version}`;
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
