# ADR-0001: One writer per binary

- Status: accepted; amended 2026-11-06 and 2026-11-07; restated 2026-11-07 so the Decision below is
  the rule the code implements
- Date: 2026-11-06

## Context

Suite Start is the hub: it discovers the apps on a machine, launches one, routes `suite://` links and
files, and indexes every app's documents in one place.

Electron apps update themselves. `electron-updater` reads a signed manifest, downloads the artifact and
replaces the application, wherever it is installed. If two programs are both entitled to do that for
one app, there are two writers of one file, two trust decisions about one manifest, and a race the
first time both run.

That is the whole of the problem. Everything below is a consequence of stating it precisely, because
the first version of this record did not: it said _"Start installs; apps update; Start asks and reads,
never performs"_, which is a rule about **which process is allowed to perform**, and it survived
contact with the product for about a day. Two amendments were needed, each reversing the one before,
which is a sign the rule was a proxy for the real one rather than the real one.

## Decision

**Exactly one process may write a given binary path, and it is the process that read the feed naming
that version.**

As applied:

- **Start installs and replaces what Start installed.** It writes inside its own install root
  (`~/Applications/Suite/<App>/<version>/`) and nowhere else. An install is a file placed and made
  executable, never an archive unpacked.
- **An app Start did not install keeps its own updater**, and Start never writes into its directory.
  That is the promise the release notes make to anyone who built a copy themselves.
- **The ownership is enforced by a launch, not by a convention.** Start launches a managed install
  with `SUITE_MANAGED_BY=start` in the child's environment; an app that sees it skips its own check
  entirely and writes its report anyway, with `checkedAt: null`. Only a launch Start performs carries
  it — a desktop entry, a shell, or a file manager does not. A single-instance lock makes the two
  hubs case impossible; the variable makes the hub-and-app case impossible.
- **One trust anchor.** The feed, its signature and the artifact's fingerprint are the same three
  checks the app would have made, made in one place.
- **One place a path lives.** `installs.json` is the only record of where a binary is, and a manifest
  may never name one, so a tampered manifest cannot redirect a launch.
- **Nothing downloads itself.** A feed may be read when the window opens and when a person asks. An
  artifact is fetched only when a button is pressed. There is no timer and no background check.
- **A version answer is labelled.** A card says whether the version came from the hub's own read of the
  signed feed or from the app's report, and when. A stale answer is shown as stale rather than as a
  fact.
- **One replaced version is kept.** An update moves the old version aside and deletes only what is
  older than that, so the card can offer a rollback. Rolling back moves the single path in
  `installs.json` to a directory already on disk: no download, no second record shape, and the version
  just left becomes the way back. Keeping more would make the hub a package manager with a retention
  policy, which is a much larger promise than "a bad update is a button".

## Consequences

- There is one writer per binary and one trust anchor per app: the manifest the app already verifies.
- Start's view of a version can lag, and says so rather than implying a live answer.
- A moved or renamed binary shows as missing rather than launching something stale, because the path is
  re-checked and every manifest re-read rather than cached.
- Everything Start places is recorded, and everything it records is under a root it may write.
- Rollback is bounded to one step. A person who wants to go back further downloads a release; the hub
  does not become a version archive.

## What this does not cover

- An app installed by a package manager is not Start's to launch, so it keeps its own updater and may
  need root to use it. The suite ships apps as AppImages precisely so that case does not arise — see
  `docs/how-to/package.md`.
- Start cannot replace its own running binary. Its own row links to the release page instead of
  offering a button that would fail.

## History

Kept because the reversals are the useful part: each one shows a rule that looked principled and was
not load-bearing.

1. **2026-11-06, original.** Start asks and reads, never performs. Start could not answer "is there a
   newer version" on a machine where the app had not run in weeks, which made the feature close to
   useless for the question a person actually has.
2. **2026-11-06, amendment.** The hub may read an app's release feed on demand — the same file the
   app's own updater reads, from the URL the app's manifest names, labelled with when it was read.
3. **2026-11-07, amendment (D45).** Start installs _and_ replaces. Once it could place a version it
   could replace one, and leaving that to the app would race it. The rule became "one process owns the
   replacement, and it is the one showing the version".
4. **2026-11-07, amendment.** The one-writer rule is enforced by the launch variable above rather than
   intended.
5. **2026-11-07, restatement.** This document. The Decision section now states the invariant and its
   consequences rather than the first attempt at it.
