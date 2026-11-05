/*
 * The launcher, as a page.
 *
 * Plain DOM rather than a framework: this is a list of apps and a list of files,
 * and every dependency here would be installed by the hub for the apps it is
 * meant to stay out of.
 *
 * It renders what the main process reports and nothing else. A card that is not
 * installed has no launch button, because the alternative is a button that fails.
 */
const bridge = globalThis.suiteStart;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function relativeTime(millis) {
  if (!millis) return "never opened";
  const minutes = Math.round((Date.now() - millis) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function renderApps(state) {
  const list = document.getElementById("apps");
  const empty = document.getElementById("apps-empty");
  list.replaceChildren();

  empty.hidden = state.apps.length > 0;
  for (const app of state.apps) {
    const card = el("li", "card");
    const title = el("div", "card-title");
    title.append(el("span", "card-name", app.name), el("span", "card-version", app.version));
    card.append(title);
    card.append(
      el(
        "p",
        "card-meta",
        `Opens ${app.fileExtensions.join(", ") || "no files"} · ${relativeTime(app.lastOpenedAt)}`,
      ),
    );

    const actions = el("div", "card-actions");
    const open = el("button", "button primary", "Open");
    open.type = "button";
    open.addEventListener("click", () => void bridge.launch(app.id));
    const forget = el("button", "button quiet", "Remove");
    forget.type = "button";
    forget.addEventListener("click", async () => {
      await bridge.removeApp(app.id);
      await refresh();
    });
    actions.append(open, forget);
    card.append(actions);
    list.append(card);
  }
}

function renderRecents(state) {
  const section = document.getElementById("recents-section");
  const list = document.getElementById("recents");
  list.replaceChildren();
  section.hidden = state.recents.length === 0;

  for (const recent of state.recents) {
    const row = el("li", "row");
    const label = el("button", "row-open");
    label.type = "button";
    label.append(
      el("span", "row-name", recent.name),
      el("span", "row-meta", `${recent.appName} · ${relativeTime(recent.openedAt)}`),
    );
    label.addEventListener("click", () => void bridge.launch(recent.appId));
    row.append(label);
    list.append(row);
  }
}

function renderRefused(state) {
  const section = document.getElementById("refused-section");
  const list = document.getElementById("refused");
  list.replaceChildren();
  section.hidden = state.refused.length === 0;

  for (const refused of state.refused) {
    const row = el("li", "row refused");
    row.append(el("span", "row-name", refused.path), el("span", "row-meta", refused.reason));
    list.append(row);
  }
}

function render(state) {
  renderApps(state);
  renderRecents(state);
  renderRefused(state);
  document.getElementById("version").textContent = `Suite Start ${state.version}`;
}

async function refresh() {
  render(await bridge.listApps());
}

document.getElementById("add").addEventListener("click", async () => {
  await bridge.addApp();
  await refresh();
});

// A launch that Start initiated (a double-clicked file) changes what is recent,
// so the window re-reads rather than trusting what it already drew.
globalThis.addEventListener("focus", () => void refresh());

void refresh();
