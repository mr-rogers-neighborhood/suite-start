import { el } from "./format.js";

/** Where "Support Suite" goes. One line, so it can point at whatever page should take money. */
const SUPPORT_URL = "https://github.com/mr-rogers-neighborhood/suite-start";

/** Settings reports what Start knows about itself, and nothing it does not. */
export function renderSettings(state, actions) {
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
  // What a reader can act on, in one idea per sentence. The ruling on who owns an update lives
  // in ADR-0001; a person only needs to know which apps update themselves and which wait for
  // them to press something.
  pair(
    "Updates",
    "Start updates the apps it installed, and only when you press Update. It checks for new " +
      "versions when this window opens. An app you installed another way updates itself.",
  );
  pair(
    "Network",
    "Start goes online to check for new versions and to download the ones you ask for. Nothing " +
      "else leaves this machine.",
  );
  pair("Version", state.version);

  // Two choices, not one: a preset is a palette family and a mode is how bright to draw it.
  // "Solarized at night" is Solarized with dark values, so a single list of six entries would
  // be the same information with half of it hidden in the labels.
  const theme = state.settings.theme;
  const presetRow = el("dd");
  const preset = el("select");
  preset.id = "theme-preset";
  preset.setAttribute("aria-label", "Theme");
  for (const option of theme.options) {
    const node = el("option", null, option.name);
    node.value = option.id;
    if (theme.choice.preset === option.id) node.selected = true;
    preset.append(node);
  }
  preset.addEventListener("change", () => actions?.setTheme?.(preset.value, theme.choice.mode));
  presetRow.append(preset);
  // What the chosen preset is, in the words the preset itself uses.
  const description = theme.options.find(
    (option) => option.id === theme.choice.preset,
  )?.description;
  if (description !== null && description !== undefined) {
    presetRow.append(el("p", "pane-note", description));
  }
  list.append(el("dt", null, "Theme"), presetRow);

  const modeRow = el("dd");
  const mode = el("select");
  mode.id = "theme-mode";
  mode.setAttribute("aria-label", "Brightness");
  for (const [value, label] of [
    ["system", "Follow the desktop"],
    ["light", "Light"],
    ["dark", "Dark"],
  ]) {
    const node = el("option", null, label);
    node.value = value;
    if (theme.choice.mode === value) node.selected = true;
    mode.append(node);
  }
  mode.addEventListener("change", () => actions?.setTheme?.(theme.choice.preset, mode.value));
  modeRow.append(mode);
  list.append(el("dt", null, "Brightness"), modeRow);

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

  // Where everything is, per app, so leaving is a decision rather than a leap. A person
  // who can see the binary, the state and the documents can back them up, move them, or
  // delete them with a file manager — which is the point of a local-first app.
  const locations = state.settings.locations;
  for (const app of locations) {
    const detail = el("dd");
    const rows = el("ul");
    for (const [label, path] of [
      ["Binary", app.executable],
      ["Documents", app.documents],
      ["Data", app.data],
    ]) {
      rows.append(el("li", null, `${label}: ${path}`));
    }
    detail.append(rows);
    list.append(el("dt", null, `${app.name} ${app.version}`), detail);
  }
}
