# Suite Start

The hub, the web surface and the control plane for Suite. It is a launcher, not a host: apps stay
separate signed processes, and Start never holds a document.

This repository is new and only its first slice exists. Read the rest as the destination, not as
description:

- **Increment 1 (built):** `@suite/contracts` and `@suite/files` plus the launcher's discovery and
  routing logic.
- Later: the Electron launcher shell, the static web app, the account dashboard, the control plane
  moved out of `suite-canvas`, and the shared relay runtime.

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
