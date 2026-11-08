# Suite Start

The hub for Suite. It is a launcher and a sync supervisor, not a host: apps stay separate signed
processes, and Start never holds a document. Suite operates no server; a person runs the `suite-sync`
server on a device they control.

## Install it

Suite Start is the one app you fetch by hand; every other app in the suite arrives through it.

**On Arch**, take the package — it needs no FUSE and gives you a menu entry:

```sh
curl -LO https://github.com/mr-rogers-neighborhood/suite-start/releases/latest/download/suite-start-bin-0.3.9-1-x86_64.pkg.tar.zst
sudo pacman -U suite-start-bin-0.3.9-1-x86_64.pkg.tar.zst
```

Everywhere else, take `suite-start-<version>-x86_64.AppImage` from the
[latest release](https://github.com/mr-rogers-neighborhood/suite-start/releases/latest), then:

```sh
chmod +x suite-start-0.3.9-x86_64.AppImage
./suite-start-0.3.9-x86_64.AppImage
```

An AppImage needs FUSE 2, which many distributions no longer install by default: `fuse2` on Arch,
`libfuse2` on Debian or Ubuntu, `fuse` on Fedora. Without it you get `dlopen(): error loading
libfuse.so.9`; `--appimage-extract-and-run` starts it anyway.

[Installing Suite Start](docs/how-to/install.md) has the checksum step, the error messages worth
recognising, and what each card state means. [Packaging](docs/how-to/package.md) explains the four
Linux forms and why the hub is packaged while the apps it installs stay AppImages: Start can only
replace a file it is allowed to write. Everything below describes the code rather than the download.

## What exists

- **Built:** the shared packages (`@suite/contracts`, `@suite/files`), the Electron launcher shell with
  discovery, install, routing and the sync-status surfaces, and supervision of the separate
  `suite-sync` server.
- **Later:** the invite/join flow, person keys, and the shared sync protocol's remaining surface. The
  hosted web app, control plane and relay are retired, not moved.

What changed, in a person's words rather than commits: [CHANGELOG.md](CHANGELOG.md).
Where accessibility stands, and what is checked by hand: [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Two rules

1. **Start is not in the data path.** It returns a path or a URL. It never proxies document bytes.
2. **Only the app owns its document.** Start opens, copies and bundles files; it cannot edit them.

---

Developer note:

**What is Suite?**

Suite is a collection of applications, a relay for sync and collaboration, and a toolbox for updating and managing your applications.

This architecture came from trying basically every application worth trying in its respective space and being left wanting. I can't claim to have replaced these applications, but I'm building my own that provide the feature sets I need. They're released open-source under the MIT license, local-first, and easy to install and manage from your own computer. Mobile applications are out of scope for now, but will come once there's a solid foundation. If these applications are useful to you, you're free to use them however you'd like, or fork and develop them into your own suite.

Applications I've tested in the past include knowledge management tools and outliners such as Obsidian, Notion, Capacities, Heptabase, Tana, Logseq, and AnyType. They also include planners and task management tools such as Sunsama, Akiflow, Todoist, and TickTick, as well as budgeting applications such as YNAB and Actual.

Each of these has something going for it that the others don't, and every one is missing a critical set of capabilities I'd want from that kind of application: a simple, local-first, integrated sync service, and flexible, deep collaboration features. Some are free and open-source, even local-first; others are tied entirely to the cloud and an internet connection. None contain the exact set of capabilities I want for a visual note-taking and research application.

That led to Suite Canvas, originally the only application in the collection. Suite Canvas combines the typed-object-graph model from apps like Capacities with the canvas-driven, research-oriented experience of Heptabase. It takes smaller influences from other applications on the list, and from some that aren't (such as a generalized version of Tana's Supertags). It's the most mature of the bunch, though still very much in alpha.

I've tried to build something like Canvas several times, and each attempt hit scope creep or a design wall that led me to abandon or restart it. Approaches that didn't work out:

- **Canvas as a CMS.** A tool for thinking always becomes constrained by the language and thought process of web design. People don't think in routes or views, and mashing the two languages together produced something confusing and not worth using. Adding mapping between the CMS and the canvas didn't help either (I carried over, and still maintain, many architectural ideas from WordPress plugins like Advanced Custom Fields, Metabox, and Pods). It was clunky and felt like using two separate applications that don't mix.
- **Infinite canvas.** It seems ideal, and I love the infinite-zoom drawings people make. I tried ICE, an experimental canvas engine, and PixiJS. Both looked striking and had genuinely impressive features (ICE let you arrange cards fractally, for example), but they were complexity tar pits that forced the entire application design to contort around them. That's before getting into accessibility, sync and collaboration, and also navigation: it predictably makes it very easy to get lost. Good for art, not clear that it is good for a structured thinking tool. I did end up integrating excalidraw, via the "Sketch" card type and embed, so you maintain the important bit of being able to draw and sketch on an infinite canvas, and then embed it in your non-infinite canvas. I also added the "Portal" card type, a way to link from one canvas board to another. These were more comprehensive and easily justified expansions.
- **No-code/low-code systems and computational notebook features.** These seem ideal too, but they cause both classes of problems above and worse ones. You lose the ability to arbitrarily rearrange your thoughts, because your links and cards now mean something beyond simple data. The result can be as striking as an infinite canavas (I even had links animate to show you the data-flow directly), but in my attempts it wasn't useful, just looked cool.

None of these experiments were pointless. Each revealed insights I didn't have before and taught me something about software design.

Suite Planner, Suite Budget, and the surrounding tooling (Suite Start and Suite Sync) came from realizing I can't fit all of these application types onto a canvas interface. I tried, and hit the the third design wall mentioned above. It was too complex, too deep, and too over-engineered to be functional and usable, let alone shippable.

So the applications are split into three that match their domains. A canvas is a thinking and research tool. A planner is a task, project management, and calendaring tool. A budget is a budgeting tool. I plan to experiment with integrations (embedding your calendar or budget into your canvas, or attaching your canvas to your calendar or budget, for example), but those features need to be considered deeply to actually be useful.

In the end, you should have a canvas, a planner, and a budget: all simple and easy to use, all with integrated and easy-to-run sync and update services, and none of them requiring you to connect to a centralized server or cloud service to use, at all. That's what will make Suite pretty sweet.

---

## Packages

| Package            | Owns                                                                          | Does not own                  |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------- |
| `@suite/contracts` | `suite.app`, `suite.deployment`, deep-link parsing, contract versioning       | Any app schema, any I/O       |
| `@suite/files`     | Envelope mechanics, base64, size limits, backup naming and retention planning | `fs`, an app's envelope shape |
| `apps/start`       | App discovery, launch plans, `suite://` routing                               | App UI, app documents         |

`@suite/files` has two entry points: `.` is pure and can run in a renderer, `./node` is where `fs`
lives. They are one package because a package that depends on a sibling cannot be installed from a git
URL — pnpm refuses a git subdependency outright. The split is preserved as subpaths, so a renderer
importing `.` still never reaches `fs`.

## Gate

```sh
pnpm check
```

Biome, a workspace build, `tsc` across every package, then Vitest. Every gate is local; no CI service
gates this repository.

## Consuming these packages

The app repositories install the two packages from this repository at a tag, not from a registry:

```json
"@suite/contracts": "git+https://github.com/mr-rogers-neighborhood/suite-start.git#v0.1.0&path:/packages/contracts",
"@suite/files": "git+https://github.com/mr-rogers-neighborhood/suite-start.git#v0.1.0&path:/packages/files"
```

Three properties make that work, and each one is deliberate:

- **No package depends on a sibling.** pnpm refuses an exotic dependency in a subdependency
  (`ERR_PNPM_EXOTIC_SUBDEP`), so the fs half lives at `@suite/files/node` rather than in its own
  package.
- **`dist` is committed.** pnpm will not run a git subdependency's build scripts without an
  `allowBuilds` entry keyed by the _resolved commit_, which changes on every commit. `pnpm check`
  rebuilds and fails if the committed output has drifted.
- **The tag is the version.** A consumer pins `#v0.1.0`; bumping it means changing two specifiers in
  one reviewable change.

GitHub Packages was the first choice and cannot host these names: its docs require the package scope to
equal the repository owner, so `@suite/contracts` would have to become
`@mr-rogers-neighborhood/contracts`, and publishing there needs a classic personal access token rather
than the OAuth token `gh auth` issues.

## Releasing

1. `pnpm check` — green, including the `dist` drift check.
2. From `suite-dev`: `node scripts/release.mjs start --tag start-vX.Y.Z --publish`. It runs that gate
   itself, builds the AppImage, signs the feed and uploads the three files.
3. The `start-` prefix matters: this repository's `v0.1.0`–`v0.7.0` tags are the **shared-package**
   line the apps pin, and a hub release must not land on one of them.
4. Update the two specifiers in the consuming repository when the packages change.

## Working on the whole suite

The hub, the sync server and the three apps are developed together from
[`suite-dev`](https://github.com/mr-rogers-neighborhood/suite-dev), which assumes the repositories are
cloned side by side. It stages the real binaries, runs the hub and the sync server together, seeds a
workspace, and owns the cross-app e2e suite. `pnpm preflight` there says what is missing.

## The launcher

`apps/start` is an Electron window: app cards, recent files, and the `suite://` handler. It is a
launcher, so it starts a process and gets out of the way — it does not embed an app's UI, proxy its
documents, or run its code.

A file row offers **Copy link**, which is `suite://<app>/workspace/<file name>`. Pasting one opens that
document in that app: the hub routes it, and the app resolves the name against its own folder. The link
names a file rather than an id, so it stays readable and needs no registry to resolve.

Discovery joins two records. The **manifest** (`suite.app.json`) is what an app ships beside its own
executable and says what it is; the **install record** (`installs.json`, in the data directory) is the
only place an executable path lives. A manifest may not name a binary, so a tampered one cannot redirect
a launch.

**Add app…** runs a file picker in the main process, reads the manifest beside the chosen executable and
writes the record — the same handoff a packaged install has, for a copy you built or placed yourself.

A managed install also earns a menu entry: `~/.local/share/applications/suite-<id>.desktop`, user scope,
written on install and rewritten on update, so the app can be opened without Start. That is the point of
the hub — it does not keep the apps to itself.

**One copy per app, and its owner is decided at install.** A copy Start installed is Start's to replace
and to delete: the card offers **Update** and **Uninstall**, and says **running** when the process Start
started is still alive, asking before it closes and replaces it. A copy you placed is first-class and
manages itself — the card says "from a folder · updates itself" and offers Open, Reveal and Forget, never
Uninstall. Two copies of one app is not a preference to offer: they share a profile and its
single-instance lock, so only one can run.

**Install** is Start's own job. `catalogue.ts` names the three apps the suite offers and the feed each
one declares, and asks every feed what version it has when the window opens or when you press _Check for
updates_. A card is then in one of four honest states: not installed, no release found, an update
available, or up to date. Pressing the button downloads the artifact named by the **verified** manifest,
checks its sha512 against that manifest, places it in `~/Applications/Suite/<App>/<version>/`, makes it
executable, writes the manifest and the install record — and nothing is unpacked, ever. `SUITE_START_APPS_ROOT` and `SUITE_START_FEED_BASE` move those two roots for a test.

```sh
pnpm build && pnpm --filter @suite/start start   # the launcher
pnpm e2e                                         # its own gate; needs a display or xvfb-run
```

`pnpm e2e` is serial and launches the real application, because what it does with a handoff from the
operating system cannot be checked any other way.
