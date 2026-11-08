import { el, relativeTime } from "./format.js";

/**
 * The line under a card's title, which is the whole point of the four states.
 *
 * Every state says something true and different. "Not installed yet" is an invitation;
 * "no release found" is an honest absence; the other two are a version and where it
 * stands.
 */
function stateLine(card) {
  const versions = card.versions > 1 ? ` · ${card.versions} versions` : "";
  const running = card.running ? " · running" : "";
  if (card.state === "not-installed") return "Not installed yet";
  if (card.state === "no-release") {
    return card.version === null ? "No release found" : `${card.version} · no release found`;
  }
  if (card.state === "update-available") {
    return `${card.version} · newer version available${versions}${running}`;
  }
  if (card.state === "local") {
    // A copy Start did not place manages itself; saying so is the whole rule.
    return `${card.version} · from a folder · updates itself${versions}${running}`;
  }
  return `${card.version} · up to date${versions}${running}`;
}

/**
 * What the app said about itself, shown only when this hub cannot answer.
 *
 * Start reads the same signed feeds the apps read, so usually it answers. When a feed is
 * silent the app's own report is still a reading of the same feed, and saying it is
 * better than a card that has nothing to say.
 */
function reportedLine(card) {
  if (card.state !== "no-release" || card.version === null) return null;
  if (card.update.state === "unknown") return null;
  if (card.update.state === "available") {
    return `The app last found ${card.update.available}`;
  }
  const when =
    card.update.checkedAt === null ? "" : ` ${relativeTime(Date.parse(card.update.checkedAt))}`;
  return `The app last checked${when} and found nothing newer`;
}

function fileCountLabel(count) {
  if (count === 0) return "No files";
  return count === 1 ? "1 file" : `${count} files`;
}

/** A download's bar, which takes the button's place while it runs. */
function progressBar(card, progress) {
  const holder = el("div", "card-progress");
  const bar = el("progress", "card-progress-bar");
  bar.max = 100;
  if (progress.total !== null && progress.total > 0) {
    bar.value = Math.min(100, Math.round((progress.received / progress.total) * 100));
    holder.append(bar, el("span", "card-progress-label", `Downloading… ${bar.value}%`));
  } else {
    // A feed that named no size gets a bar that moves without claiming to know how far.
    bar.removeAttribute("value");
    holder.append(bar, el("span", "card-progress-label", "Downloading…"));
  }
  holder.dataset.state = "downloading";
  holder.setAttribute("role", "status");
  holder.setAttribute("aria-label", `Installing ${card.name}`);
  return holder;
}

/** The buttons one card offers, which differ by state and by whether a bar is running. */
function cardActions(card, actions) {
  const buttons = el("div", "card-actions");

  const button = (label, className, onClick) => {
    const node = el("button", `button ${className}`, label);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  };

  if (card.state === "not-installed" && card.id !== null) {
    buttons.append(button(`Install ${card.name}`, "primary", () => actions.install(card.id)));
    return buttons;
  }

  // Nothing is installed, so there is nothing to open and nothing to remove.
  if (card.id === null || card.version === null) return buttons;

  if (card.state === "update-available" && card.available !== null) {
    buttons.append(
      button(`Update to ${card.available}`, "primary", () => actions.install(card.id)),
    );
    buttons.append(button("Open", "quiet", () => actions.launch(card.id)));
  } else {
    buttons.append(button("Open", "primary", () => actions.launch(card.id)));
  }

  if (card.state === "local") {
    // A copy Start did not install: it can open it, show where it is, and stop listing it.
    // Deleting it is not Start's to do — the person put it there.
    buttons.append(button("Reveal", "quiet", () => actions.reveal(card.id)));
    buttons.append(button("Forget", "quiet", () => actions.remove(card.id)));
    return buttons;
  }

  // Managed: Start placed these files, so Start is the one that may delete them.
  buttons.append(button("Uninstall", "quiet", () => actions.uninstall(card.id)));
  return buttons;
}

function appCard(card, actions, progress, launchError) {
  const node = el("li", card.health.ok ? "card" : "card card-refused");
  if (card.id !== null) node.dataset.appId = card.id;
  node.dataset.state = card.state;

  const title = el("div", "card-title");
  // The app's own mark, so a card and the window it opens look like the same thing.
  if (card.icon !== null) {
    const mark = el("img", "card-mark");
    mark.src = card.icon;
    mark.alt = "";
    mark.width = 24;
    mark.height = 24;
    title.append(mark);
  }
  title.append(el("span", "card-name", card.name));
  // What the app honestly is, said quietly. A release channel is a promise about how much
  // to trust the thing; hiding it until someone reads the release notes is not a favour.
  if (card.channel !== "stable") {
    title.append(el("span", "card-channel", card.channel));
  }
  node.append(title);

  if (!card.health.ok) {
    node.append(el("p", "card-health", card.health.reason));
    return node;
  }

  // An install that failed and a launch that died share one slot: it is the sentence
  // that explains why the thing the person pressed did not happen.
  const problem = progress?.phase === "failed" ? progress.reason : (launchError ?? null);
  const line = el("p", "card-meta card-state", problem ?? stateLine(card));
  if (problem !== null) line.dataset.state = "failed";
  node.append(line);

  const reported = reportedLine(card);
  if (reported !== null) node.append(el("p", "card-meta card-update", reported));

  if (card.version !== null) {
    const opens = card.fileExtensions.join(", ") || "no files";
    node.append(el("p", "card-meta", `Opens ${opens} · ${relativeTime(card.lastOpenedAt)}`));
    node.append(el("p", "card-meta card-files", fileCountLabel(card.fileCount)));
  }

  if (progress?.phase === "downloading") node.append(progressBar(card, progress));
  else node.append(cardActions(card, actions));

  return node;
}

/** The hub's own row: a fact, because it cannot replace its own running binary. */
function selfRow(card) {
  const node = el("li", "card card-self");
  node.dataset.appId = card.id ?? "start";
  const title = el("div", "card-title");
  title.append(el("span", "card-name", card.name), el("span", "card-version", card.version));
  node.append(title);

  const why = card.reason ?? "no release found";
  const sentence = `${why.charAt(0).toUpperCase()}${why.slice(1)}.`;
  const says =
    card.state === "update-available" && card.available !== null
      ? `${card.available} is published. Start cannot replace its own running binary, so this opens the page where you can.`
      : card.available !== null
        ? `${card.available} is the newest release, and Start cannot replace its own running binary.`
        : `${sentence} Start cannot replace its own running binary, so it updates itself.`;
  const note = el("p", "card-meta card-self-note", says);

  // The one thing this row can offer. `target` sends it through the window's
  // external-link handler, so the browser opens it and the page never leaves Start.
  if (card.state === "update-available" && card.releases !== null) {
    const link = el("a", "card-self-link", "Open the release page…");
    link.href = card.releases;
    link.target = "_blank";
    link.rel = "noreferrer";
    note.append(" ", link);
  }
  node.append(note);
  return node;
}

/**
 * The Apps pane.
 *
 * A card that cannot be launched has no Open button, because the alternative is a button
 * that fails. What is wrong with it is a line on the card rather than a second list
 * somewhere else.
 */
export function renderApps(state, actions) {
  const list = document.getElementById("apps");
  const empty = document.getElementById("apps-empty");
  if (!list || !empty) return;
  list.replaceChildren();

  const progressById = new Map((state.installing ?? []).map((entry) => [entry.id, entry]));
  const launchErrors = state.launchErrors ?? {};
  empty.hidden = state.apps.length > 0;
  for (const card of state.apps) {
    list.append(
      appCard(
        card,
        actions,
        card.id === null ? undefined : progressById.get(card.id),
        card.id === null ? null : (launchErrors[card.id] ?? null),
      ),
    );
  }
  if (state.self) list.append(selfRow(state.self));
}
