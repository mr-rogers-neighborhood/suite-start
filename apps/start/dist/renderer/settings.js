import { el } from "./format.js";

/** A catalog is a path, a refusal, or the honest absence of one. */
function catalogLine(catalog) {
  if (catalog.state === "configured") return `Read from ${catalog.path}. Never fetched.`;
  if (catalog.state === "refused") return `${catalog.path} was refused: ${catalog.reason}`;
  return "No catalog configured, so update states are unknown.";
}

/** Settings reports what Start knows about itself, and nothing it does not. */
export function renderSettings(state) {
  const list = document.getElementById("settings");
  if (!list) return;
  list.replaceChildren();

  const pair = (term, value, id) => {
    const valueNode = el("dd", null, value);
    if (id) valueNode.id = id;
    list.append(el("dt", null, term), valueNode);
  };

  pair("Data directory", state.settings.dataDirectory);
  pair("Documents", state.settings.documentsRoot);
  pair("Catalog", catalogLine(state.catalog), "catalog-value");
  pair("Deployment", "Not configured. This build makes no network request.");
  pair("Version", state.version);

  const roots = el("dd");
  const rootList = el("ul");
  for (const root of state.settings.installRoots) rootList.append(el("li", null, root));
  roots.append(rootList);
  list.append(el("dt", null, "Install roots"), roots);
}
