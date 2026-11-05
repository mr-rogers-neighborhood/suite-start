import { el, relativeTime } from "./format.js";

/** The Files pane. Until the index lands, this is Start's own history. */
export function renderFiles(state, actions) {
  const list = document.getElementById("recent-files");
  const empty = document.getElementById("files-empty");
  if (!list || !empty) return;
  list.replaceChildren();

  empty.hidden = state.recents.length > 0;
  for (const recent of state.recents) {
    const row = el("li", "row");
    const open = el("button", "row-open");
    open.type = "button";
    open.append(
      el("span", "row-name", recent.name),
      el("span", "row-meta", `${recent.appName} · ${relativeTime(recent.openedAt)}`),
    );
    open.addEventListener("click", () => actions.openRecent(recent));
    row.append(open);
    list.append(row);
  }
}
