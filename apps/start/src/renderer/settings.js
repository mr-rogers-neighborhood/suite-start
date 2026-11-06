import { el } from "./format.js";

/** Where "Support Suite" goes. One line, so it can point at whatever page should take money. */
const SUPPORT_URL = "https://github.com/mr-rogers-neighborhood/suite-start";

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
  pair(
    "Updates",
    "Each app updates itself and reports what it found. This window reads that report and fetches nothing.",
  );
  pair("Network", "None. This build makes no request of its own.");
  pair("Version", state.version);

  // The one ask in the product: a URL, no account, nothing gated. The window
  // handler opens `https` in the system browser, so this is a plain link and not
  // a channel.
  const support = el("dd");
  const link = el("a", null, "Support Suite…");
  link.href = SUPPORT_URL;
  link.rel = "noreferrer";
  link.target = "_blank";
  support.append(link);
  list.append(el("dt", null, "Support"), support);

  const roots = el("dd");
  const rootList = el("ul");
  for (const root of state.settings.installRoots) rootList.append(el("li", null, root));
  roots.append(rootList);
  list.append(el("dt", null, "Install roots"), roots);
}
