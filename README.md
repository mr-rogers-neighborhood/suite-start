# Suite Start

The hub for Suite. It is a launcher and a sync supervisor, not a host: apps stay separate signed
processes, and Start never holds a document. Suite operates no server; a person runs the `suite-sync`
server on a device they control.

This repository is new and only its first slice exists. Read the rest as the destination, not as
description:

- **Increment 1 (built):** `@suite/contracts` and `@suite/files` plus the launcher's discovery and
  routing logic.
- Later: the Electron launcher shell, supervision of the separate `suite-sync` server, the invite/join
  and sync-status surfaces, and the shared sync protocol. The hosted web app, control plane and relay
  are retired, not moved.

## Two rules

1. **Start is not in the data path.** It returns a path or a URL. It never proxies document bytes.
2. **Only the app owns its document.** Start opens, copies and bundles files; it cannot edit them.

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
2. `git tag vX.Y.Z && git push origin main --tags`.
3. Update the two specifiers in the consuming repository.

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
writes the record. That stands in for an installer this phase does not build, and it uses the same
handoff a packaged install has.

```sh
pnpm build && pnpm --filter @suite/start start   # the launcher
pnpm e2e                                         # its own gate; needs a display or xvfb-run
```

`pnpm e2e` is serial and launches the real application, because what it does with a handoff from the
operating system cannot be checked any other way.
