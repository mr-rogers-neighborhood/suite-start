# Changelog

Written for people, not commits: what you can do now that you could not before, and what changed
underneath enough to matter.

Versions here are Suite Start's own. The `v0.x` tags in this repository belong to the shared packages
the apps pin, and are not releases of the launcher.

## [Unreleased]

No changes yet.

## [0.3.9] - 2026-11-07

### Fixed

- **The sidebar follows the theme.** It was a hardcoded near-white that no theme ever set, so
  it stayed light in every dark preset.
- **The page, the cards and the sidebar are three different surfaces.** The page was painted
  the same role as a card, so in light mode cards were two near-whites with a faint border.
- **The select controls are fields.** They drew the browser's own grey control beside rounded,
  themed inputs.
- **The attention badge uses the ink its theme defines** for a filled danger surface, instead
  of assuming white.
- The settings labels no longer shift when a long path appears in a value, and the sidebar's
  first item is named for the pane it opens.

## [0.3.8] - 2026-11-07

### Added

- **Three colour themes, each in light and dark.** Suite (unchanged), Solarized in its two
  official variants, and Warm: charcoal and amber, in the spirit of Logseq. Settings offers a
  Theme list and a Brightness toggle, because those are two questions.
- **Every colour is now a named role** with a companion ink, so a filled button can never end
  up with text the theme did not check. The values are measured against WCAG 2.2 AA in the
  build gate: 4.5:1 for text, 3:1 for focus rings and component edges.

### Fixed

- A text field's border is a component boundary, so it now clears 3:1 rather than using the
  decorative hairline. The focus ring uses its own role.

## [0.3.7] - 2026-11-07

### Fixed

- **A menu entry repairs itself when the hub opens.** An entry is only written when its app is
  installed or updated, so an app that is already current kept the icon an older build gave it —
  forever. Startup now rewrites the entry and icon of every app this hub installed, which is how
  the icon fix reaches a machine that was already up to date.

### Changed

- The Apps, Files and Settings panes describe themselves in one sentence each, and the apps pane
  is titled Start rather than Apps.

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
