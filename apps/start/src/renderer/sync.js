import { el } from "./format.js";

/**
 * The Sync pane: what this machine is holding, and who is connected to it.
 *
 * There is no document here to show, and that is the design rather than a limitation. What
 * a person can act on is: is it running, can other devices reach it, which workspaces does
 * it carry, and which devices are in them.
 *
 * The words are deliberately plain. "Frames", "epochs" and "keys" are how this works; none
 * of them is anything a person is being asked to do, and a pane that explains the machinery
 * instead of the state makes the state harder to find.
 */

/** What to say about a way back in, in a person's words. */
const RECOVERY_WORDS = {
  made: "A way back in has been saved for this workspace.",
  declined: "No way back in was saved. Every device would have to be recovered by hand.",
  none: "No way back in has been saved on this machine.",
};

const ROLE_WORDS = {
  owner: "owner",
  editor: "editor",
  viewer: "viewer",
  null: "no role yet",
};

export function renderSync(state, actions) {
  const panel = document.getElementById("panel-sync");
  if (!panel) return;
  const sync = state.sync;
  panel.replaceChildren();

  const head = el("header", "pane-head");
  head.append(el("h2", null, "Sync"));
  // A consequence, not a restatement of the heading above it.
  head.append(
    el(
      "p",
      "pane-note",
      sync.running
        ? "On. Other devices can reach this machine."
        : "Off. Nothing can reach this machine.",
    ),
  );
  panel.append(head);

  panel.append(addressBlock(sync, actions));
  panel.append(scopeBlock(sync, actions));
  panel.append(workspaceBlock(sync));
  panel.append(
    el(
      "p",
      "pane-note",
      "Documents stay encrypted on their way through this machine. It carries them; it cannot read them.",
    ),
  );
}

function addressBlock(sync, actions) {
  const block = el("div", "switch-block");
  const value = el("code", null, sync.address ?? "not listening");
  value.id = "sync-address";

  const toggle = el("button", "button", sync.running ? "Turn sync off" : "Turn sync on");
  toggle.type = "button";
  toggle.id = "sync-toggle";
  toggle.addEventListener("click", async () => {
    toggle.disabled = true;
    await (sync.running ? actions.stopSync() : actions.startSync());
  });

  block.append(el("h3", null, "This machine\u2019s address"), value, toggle);
  return block;
}

function scopeBlock(sync, actions) {
  const block = el("div", "switch-block");
  block.append(el("h3", null, "Who can reach it"));

  const label = el("label", "switch");
  const box = el("input");
  box.type = "checkbox";
  box.id = "sync-scope";
  box.checked = sync.scope === "network";
  box.addEventListener("change", async () => {
    box.disabled = true;
    await actions.setSyncScope(box.checked ? "network" : "loopback");
  });

  label.append(box, el("span", null, "Other devices on this network"));
  block.append(label);
  block.append(
    el(
      "p",
      "pane-note",
      sync.scope === "network"
        ? "Listening on every interface. Frames are encrypted, but anyone on the network can try to knock."
        : "Listening on this machine only. A device elsewhere needs the network switch, or a tunnel you already trust.",
    ),
  );
  return block;
}

function workspaceBlock(sync) {
  const block = el("div", "switch-block");
  block.append(el("h3", null, "Workspaces"));

  if (!sync.running) {
    block.append(el("p", "pane-note", "Turn sync on to see what this machine is carrying."));
    return block;
  }
  if (sync.workspaces.length === 0) {
    block.append(
      el(
        "p",
        "pane-note",
        "Nothing yet. A workspace appears here the first time a device joins it.",
      ),
    );
    return block;
  }

  const list = el("ul", "sync-workspaces");
  for (const workspace of sync.workspaces) {
    const item = el("li");
    item.append(el("code", null, shortId(workspace.workspaceId)));
    item.append(
      el(
        "p",
        "pane-note",
        workspace.frames === 0
          ? "Nothing has changed here yet."
          : `${workspace.frames} ${workspace.frames === 1 ? "change" : "changes"} passed through.`,
      ),
    );

    item.append(el("p", "pane-note", RECOVERY_WORDS[workspace.recovery ?? "none"]));

    const members = el("ul", "sync-members");
    for (const member of workspace.members) {
      members.append(el("li", null, `${member.name} · ${ROLE_WORDS[String(member.role)]}`));
    }
    if (workspace.members.length === 0) members.append(el("li", null, "no devices yet"));
    item.append(members);
    list.append(item);
  }
  block.append(list);
  return block;
}

/** An id is 64 hex characters; six are enough to tell two apart on screen. */
function shortId(id) {
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
