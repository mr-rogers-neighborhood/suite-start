# ADR-0001: Start owns routing, not updates

- Status: accepted; amended 2026-11-06 (the hub may read a feed when asked) and 2026-11-07
  (Start installs **and** replaces — D45)
- Date: 2026-11-06

## Context

Suite Start is the hub: it discovers the apps on a machine, launches one, routes `suite://` links and
files, and indexes every app's documents in one place. Its stated purpose also included a "toolbox for
updating and managing your applications", and the first design had Start read a release catalog and
offer updates from it.

Electron apps update themselves. `electron-updater` reads a signed manifest, downloads the artifact and
replaces the application, and it does so wherever the app is installed. If Start also updated apps,
there would be two programs entitled to write the same file, two trust decisions about the same
manifest, and a race the first time both ran.

## Decision

**Start installs; apps update; Start asks and reads, never performs.**

- An app owns its own bytes and its own update feed. It updates itself.
- Start records where it last saw an executable, re-checks that path on launch, and re-reads every
  manifest from disk each time it lists. It never writes into an app's directory.
- Start shows what an app reports about itself. An app's update state (current version, whether a newer
  one exists, when it last checked) is written by the app into its own user data directory, and Start
  reads that file.
- Start makes no request unless a person asks for one. See the amendment below.
- "Update" in Start opens the app, which updates on launch.
- Installing an app that is not on the machine at all is Start's job, because there is no app yet to
  own its own bytes. That is the installer, and it is a later milestone.

## Consequences

- There is one writer per binary and one trust anchor per app: the manifest the app already verifies.
- Start's view of a version is as fresh as the app's last run. It says when it last checked rather than
  implying a live answer.
- A moved or renamed binary shows as missing rather than launching something stale, because the path is
  re-checked and the manifest re-read rather than cached.
- The installer is the only place Start places files, which keeps the rule easy to state and easy to
  test: everything before it is read-only.

## Amendment (2026-11-06): the hub may read a feed when asked

The decision above leaves the hub unable to answer "is there a newer version" until the app has run and
written its report. On a machine where an app has not been opened in weeks, the answer is weeks old,
which makes the feature close to useless for the question a person actually has.

So the hub may also read an app's release feed, under four conditions:

- **On demand only.** A person presses _Check for updates_. There is no timer, no request at launch, and
  no request in the background.
- **One source.** The hub reads the same file the app's updater reads (`latest-linux.yml`, `latest.yml`,
  `latest-mac.yml` by platform) from the base URL the app's own manifest names in `update.feed`. It does
  not consult a second source, so the hub and the app cannot disagree about what is newest.
- **The answer is labelled.** The card says whether the version came from the app or from a check, and
  when the check ran. A stale answer is shown as stale rather than as a fact.
- **It changes no file.** The check is read-only. Installing and replacing remain the app's business,
  and the rule from the body of this record is unchanged: Start asks and reads, never performs.

The sentence in Settings changes with it, from "this build makes no network request" to the truth: no
request unless you ask for one.

## Amendment (2026-11-07): Start installs **and** replaces — D45

The body of this record ends with a promise: "installing an app that is not on the machine at all is
Start's job … that is the installer, and it is a later milestone." That milestone is here, and it
overturns the sentence before it.

**The decision changes from "Start installs; apps update" to "Start installs and updates; an app updates
itself only when nobody else is doing it."**

Why the old rule cannot survive its own milestone:

- An install happens because Start read a feed and learned a version it can offer. Once it can _place_ a
  version it can also _replace_ one, and the app's own updater would then race it — two programs
  entitled to write the same path, which is the exact failure the original decision existed to prevent.
- The person is looking at Start. A card that says "0.2.0 is available" and then does nothing, while a
  silent updater acts on launch, is a card that lies about who is in charge.
- Replacement needs a version the app does not know about yet. Only the process that read the feed knows
  it, and only that process can act on it.

So one process owns the replacement, and it is the one showing the version.

What this keeps from the original record, unchanged:

- **One writer per binary.** Start writes; the app it installed does not. An app that Start did not
  install keeps its own updater, which is the promise the release notes have always made to anyone who
  built a copy themselves.
- **One trust anchor.** The feed, its signature and the artifact's fingerprint are the same three checks
  the app would have made, made in one place.
- **Nothing downloads itself.** A feed may be read when the window opens and when a person asks; an
  artifact is fetched only when a button is pressed. This widens the first amendment's "on demand only"
  by exactly one event — the launcher opening — and adds no timer and no background check.
- **Everything Start places is recorded.** `installs.json` is still the only place a binary path lives,
  and the rule that a manifest may not name a path is unchanged.

What it changes:

- Start writes inside its own install root (`~/Applications/Suite/<App>/<version>/`), and nowhere else.
  An install is a file placed and made executable, never an archive unpacked.
- A card's version answer comes from Start's own read of the signed feed; the app's `update-state.json`
  is a second opinion shown when the feed is silent.

**Not yet landed.** An app Start installed is meant to be launched with `SUITE_MANAGED_BY=start` and to
skip its own check while still writing its report. That flag is the next step, so until it lands the two
updaters can still race on a machine where both are running. The amendment is dated from the decision,
not from the flag.
