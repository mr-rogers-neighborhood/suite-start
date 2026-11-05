import { el, relativeTime } from "./format.js";

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
    const card = el("li", "card");
    card.dataset.appId = app.id;

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

    const buttons = el("div", "card-actions");
    const open = el("button", "button primary", "Open");
    open.type = "button";
    open.addEventListener("click", () => actions.launch(app.id));
    const forget = el("button", "button quiet", "Remove");
    forget.type = "button";
    forget.addEventListener("click", () => actions.remove(app.id));
    buttons.append(open, forget);
    card.append(buttons);
    list.append(card);
  }

  const section = document.getElementById("refused-section");
  const refused = document.getElementById("refused");
  if (!section || !refused) return;
  refused.replaceChildren();
  section.hidden = state.refused.length === 0;

  for (const install of state.refused) {
    const row = el("li", "row refused");
    row.append(el("span", "row-name", install.path), el("span", "row-meta", install.reason));
    refused.append(row);
  }
}
