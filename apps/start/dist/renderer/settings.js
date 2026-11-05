import { el } from "./format.js";

/** Settings reports what Start knows about itself, and nothing it does not. */
export function renderSettings(state) {
  const list = document.getElementById("settings");
  if (!list) return;
  list.replaceChildren();

  const pair = (term, value) => {
    list.append(el("dt", null, term), el("dd", null, value));
  };

  pair("Data directory", state.settings.dataDirectory);
  pair("Version", state.version);

  const roots = el("dd");
  const rootList = el("ul");
  for (const root of state.settings.installRoots) rootList.append(el("li", null, root));
  roots.append(rootList);
  list.append(el("dt", null, "Install roots"), roots);
}
