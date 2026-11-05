import { el, relativeTime } from "./format.js";

/** What the catalog said, in three words a card can carry. */
const UPDATE_LABELS = {
  "update-available": "Update available",
  "up-to-date": "Up to date",
  unknown: "Update state unknown",
};

function fileCountLabel(count) {
  if (count === 0) return "No files";
  return count === 1 ? "1 file" : `${count} files`;
}

/**
 * The Apps pane.
 *
 * A card that cannot be launched has no Open button, because the alternative is
 * a button that fails. What is wrong with it is a line on the card rather than a
 * second list somewhere else.
 */
export function renderApps(state, actions) {
  const list = document.getElementById("apps");
  const empty = document.getElementById("apps-empty");
  if (!list || !empty) return;
  list.replaceChildren();

  empty.hidden = state.apps.length > 0;
  for (const app of state.apps) {
    const card = el("li", app.health.ok ? "card" : "card card-refused");
    if (app.id !== null) card.dataset.appId = app.id;

    const title = el("div", "card-title");
    title.append(el("span", "card-name", app.name), el("span", "card-version", app.version));
    card.append(title);

    if (!app.health.ok) {
      card.append(el("p", "card-health", app.health.reason));
      list.append(card);
      continue;
    }

    card.append(
      el(
        "p",
        "card-meta",
        `Opens ${app.fileExtensions.join(", ") || "no files"} · ${relativeTime(app.lastOpenedAt)}`,
      ),
    );

    const update = el(
      "p",
      "card-meta card-update",
      `${app.channel} · ${UPDATE_LABELS[app.update] ?? UPDATE_LABELS.unknown}`,
    );
    update.dataset.state = app.update;
    card.append(update, el("p", "card-meta card-files", fileCountLabel(app.fileCount)));

    const buttons = el("div", "card-actions");
    const open = el("button", "button primary", "Open");
    open.type = "button";
    open.addEventListener("click", () => actions.launch(app.id));
    buttons.append(open);
    if (app.id !== null) {
      const forget = el("button", "button quiet", "Remove");
      forget.type = "button";
      forget.addEventListener("click", () => actions.remove(app.id));
      buttons.append(forget);
    }
    card.append(buttons);
    list.append(card);
  }
}
