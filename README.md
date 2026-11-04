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

| Package             | Owns                                                                          | Does not own                  |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| `@suite/contracts`  | `suite.app`, `suite.deployment`, deep-link parsing, contract versioning       | Any app schema, any I/O       |
| `@suite/files`      | Envelope mechanics, base64, size limits, backup naming and retention planning | `fs`, an app's envelope shape |
| `@suite/files-node` | Atomic write, fsync-then-rename, applying a retention plan                    | Parsing an app's document     |
| `apps/start`        | App discovery, launch plans, `suite://` routing                               | App UI, app documents         |

`@suite/files` is pure so it can run in a renderer; `@suite/files-node` is where `fs` lives. That
split is the point: an app imports the pure half and its own main process imports the other.

## Gate

```sh
pnpm check
```

Biome, a workspace build, `tsc` across every package, then Vitest. Every gate is local; no CI service
gates this repository.

## Publishing

`@suite/contracts` and `@suite/files` are consumed by the app repositories, which pin exact versions.
Publish a pre-release with `pnpm publish:packages` once the registry and scope are settled; see the
open item in the canvas refactor plan. Until then the apps consume them through a packed tarball,
never through a relative path into this checkout.
