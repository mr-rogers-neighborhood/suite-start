import { el, relativeTime } from "./format.js";

/**
 * What the app said about itself, in the words a card can carry.
 *
 * The app owns its update, so these are a reading of its report rather than a
 * claim the hub makes. An app that has never asked says so, with the version it
 * is running when it reported one.
 */
function updateLabel(update, version) {
  if (update.state === "available") return `Update available · ${update.available}`;
  if (update.state === "current") {
    const when =
      update.checkedAt === null ? "" : ` · checked ${relativeTime(Date.parse(update.checkedAt))}`;
    return `Up to date${when}`;
  }
  return version === null ? "Update state unknown" : `${version} · update state unknown`;
}

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
      `${app.channel} · ${updateLabel(app.update, app.version)}`,
    );
    update.dataset.state = app.update.state;
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
