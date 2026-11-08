# Changelog

Written for people, not commits: what you can do now that you could not before, and what changed
underneath enough to matter.

Versions here are Suite Start's own. The `v0.x` tags in this repository belong to the shared packages
the apps pin, and are not releases of the launcher.

## [Unreleased]

No changes yet.

## [0.3.6] - 2026-11-07

### Fixed

- **Each app's menu entry shows its own icon.** Every entry was given the hub's own mark, so all
  three apps looked identical in the menu — and an update overwrote a correct icon installed by a
  package with it. The artwork now comes from the app, at the size the icon folder claims.
- The app's mark lines up with the app's name on its card. It sat about eight pixels high.

### Added

- **Go back one version.** After an update, a card offers the version it replaced. The replaced
  binary is kept rather than deleted, and going back needs no download. Pressing it again returns
  you, so the button is not a one-way door.
- **Settings says where everything is.** Per installed app: the binary, the documents folder and
  the data directory — the same paths the app itself resolves, so they cannot drift.
- **A theme switch.** The window follows the desktop until you say otherwise; Settings offers
  Follow the desktop, Light and Dark, and the choice is remembered across restarts.

## [0.3.5] - 2026-11-07

### Added

- Each app's card carries that app's own mark, so a card and the window it opens look like the
  same thing.
- A card says when an app is on a channel other than stable, rather than leaving it to whoever
  reads the release notes.

### Fixed

- The window is drawn before the local relay starts, so a slow or conflicting port no longer
  delays the first paint.
- An app installed under the hub's own root is never described as "from a folder". Before the
  release feed answers, the card said the opposite of the truth about an app Start had installed.

## [0.3.4] - 2026-11-07

### Fixed

- The menu entry matches the class the window actually reports, and the package no longer ships a
  dangling link.

## [0.3.3] - 2026-11-07

### Added

- A managed install earns a menu entry, so it can be opened without the hub. This is the release
  where the launcher stopped being the only door to the apps it installed.

## [0.3.2] - 2026-11-07

### Fixed

- The Arch package installs a tree you can enter. 0.3.1 installed and then reported
  `Could not find the program '/opt/suite-start/suite-start'`, because a root-owned directory the
  user cannot traverse makes every file inside it look missing.
- The package ships the icon at every size rather than one, so panels stop scaling a single image.

## [0.3.1] - 2026-11-07

### Added

- A launch that fails says why, instead of a card that still offers Open.
- An Arch package, so the hub needs neither FUSE nor a manual `chmod`.

### Fixed

- Artifact names carry no spaces. GitHub rewrites a space to a dot in an asset name, which made the
  signed feed name a file the release did not have — a 404 for every install.

## [0.3.0] - 2026-11-06

### Added

- The first launcher that can install and update the other apps from their signed feeds: one
  window, one card per app, one place to press.
