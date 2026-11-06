import { el, relativeTime } from "./format.js";

/**
 * The Files pane.
 *
 * Two groups and one rule: Start opens a file, and says when there is no app to
 * open it with. A row for an uninstalled app keeps its place, because hiding it
 * would make a person's own folder look empty.
 */
function fileRow(file, actions) {
  const row = el("li", "row");
  const meta = file.installed
    ? `${file.appName} · ${relativeTime(file.modifiedAt)}`
    : `${file.appName} · no app installed`;

  if (!file.installed) {
    const label = el("div", "row-open row-missing");
    label.append(el("span", "row-name", file.name), el("span", "row-meta", meta));
    row.append(label);
    return row;
  }

  const open = el("button", "row-open");
  open.type = "button";
  open.append(el("span", "row-name", file.name), el("span", "row-meta", meta));
  open.addEventListener("click", () => actions.openFile(file.path));
  row.append(open);

  // The link is what makes a document reachable from outside the hub: pasted in a
  // message, it opens the same file for whoever runs the suite.
  if (file.link) {
    const copy = el("button", "row-copy");
    copy.type = "button";
    copy.textContent = "Copy link";
    copy.title = file.link;
    copy.addEventListener("click", async () => {
      const copied = await actions.copyLink(file.link);
      copy.textContent = copied ? "Copied" : "Copy failed";
      window.setTimeout(() => {
        copy.textContent = "Copy link";
      }, 1_500);
    });
    row.append(copy);
  }

  return row;
}

export function renderFiles(state, actions) {
  const recent = document.getElementById("recent-files");
  const recentEmpty = document.getElementById("recent-empty");
  const all = document.getElementById("all-files");
  const allEmpty = document.getElementById("files-empty");
  if (!recent || !recentEmpty || !all || !allEmpty) return;

  recent.replaceChildren();
  recentEmpty.hidden = state.recents.length > 0;
  for (const entry of state.recents) {
    const row = el("li", "row");
    const open = el("button", "row-open");
    open.type = "button";
    open.append(
      el("span", "row-name", entry.name),
      el("span", "row-meta", `${entry.appName} · ${relativeTime(entry.openedAt)}`),
    );
    open.addEventListener("click", () => actions.openRecent(entry));
    row.append(open);
    recent.append(row);
  }

  all.replaceChildren();
  allEmpty.hidden = state.files.length > 0;
  for (const file of state.files) all.append(fileRow(file, actions));
}
