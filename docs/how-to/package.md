# Packaging: four forms, and which one is for what

A note for anyone arriving from web development, where "deploy" means one thing. On the desktop it
means four, and they differ in **who owns the file on disk** — which decides everything else, including
who is allowed to update it.

| Form                   | Closest web analogy                             | Who owns the installed files     | Updates arrive by           | Root needed |
| ---------------------- | ----------------------------------------------- | -------------------------------- | --------------------------- | ----------- |
| **AppImage**           | a self-contained static build you run with `./` | the user, in `~/Applications`    | Start, from the signed feed | no          |
| **pacman / deb / rpm** | deploying into the host's package registry      | **root**, under `/opt` or `/usr` | the package manager         | yes         |
| **Flatpak**            | a container runtime for desktop apps            | root, inside a sandbox           | an OSTree remote            | yes         |
| **snap**               | same shape, Canonical's runtime                 | root, sandboxed                  | the Snap Store              | yes         |

## The rule this repository is built on

**Start can only replace a file it can write.**

An AppImage in `~/Applications/Suite/<App>/<version>/` is owned by the person who ran the installer, so
Start — running as that person — can download the next version and put it there. That is the whole
update model: one process decides, and it is the window you are looking at.

A distro package is root-owned. Start cannot write to `/usr`, so it cannot update what the package
manager installed. That is not a limitation to work around; it is why the suite ships two different
things:

- **The hub is packaged.** It never updates itself anyway (its own row links to the release page), so
  root ownership costs nothing, and it buys a menu entry, a registered `suite://` handler, and no FUSE.
- **The apps stay AppImages.** That is what makes Start their updater, and what makes the update path
  something a person can rehearse rather than read about.

## The Arch package

`apps/start/packaging/arch/PKGBUILD` builds `suite-start-bin`. It **repackages the published
AppImage** rather than rebuilding the app, so the package and the signed feed can never describe
different releases.

```sh
cd apps/start/packaging/arch
makepkg --nocheck --nodeps            # downloads the pinned AppImage, verifies its sha256, builds
sudo pacman -U suite-start-bin-<version>-1-x86_64.pkg.tar.zst
```

What `package()` does, and why each part:

- `--appimage-extract` into `/opt/suite-start` — no mounting, so **no `fuse2` dependency**. The hub
  starts on a machine that has never heard of FUSE.
- A `.desktop` of its own, with `Exec=/opt/suite-start/suite-start %U` and
  `MimeType=x-scheme-handler/suite;`, so links open the hub and the window is associated with its own
  entry.
- The icons the AppImage already carries, installed under `/usr/share/icons/hicolor/`.
- `chrome-sandbox` set to `4755` root-owned, which is what lets Electron's renderer sandbox work
  properly. The AppImage cannot do this — a package can, because it installs as root.

The `-bin` suffix is the Arch convention for a package that repackages an upstream binary rather than
compiling one. It is not in any index: it is attached to the GitHub release beside the AppImage.

### Why not electron-builder's `pacman` target

It exists (`--linux pacman`) and it runs, off the `fpm` electron-builder downloads for you. What it
produced here:

| fpm wrote                             | Why it fails                                                 |
| ------------------------------------- | ------------------------------------------------------------ |
| `pkgname = Suite Start`               | Package names cannot contain spaces; `pacman -U` refuses it. |
| `Depends On: … http-parser …`         | Arch does not ship `http-parser`.                            |
| `Depends On: libappindicator-gtk3`    | Arch calls it `libappindicator`.                             |
| Installs to `/opt/Suite Start/`       | The space is in every path in the tree.                      |
| `.INSTALL` runs `update-alternatives` | A Debian-ism; falls through to a symlink.                    |

`fpm` is a good general packager; it is not an Arch packager. Forty lines of PKGBUILD is the honest
answer, and `makepkg` is the tool an Arch user already trusts.

### Why not Flatpak for the hub

Flatpak is the right answer to "ship one self-contained app to every distro". The hub is the wrong app
for it:

- **Its job is to exec host binaries** from `~/Applications/Suite` and write there. Inside a sandbox
  that needs `--filesystem=home` and `flatpak-spawn` — the sandbox is opened wide to do precisely what
  it already does unsandboxed.
- **It would gain a second update channel.** Flatpak updates come from an OSTree remote; the suite's
  trust story is a signed yml and a sha512. Two ways to receive bytes is one way too many.
- **Heavier to build:** `flatpak-builder` plus an `org.freedesktop.Sdk` runtime.

Where Flatpak could earn a place later: as an alternative channel for a _single self-contained app_
(Canvas) for people who distrust AppImages. Not for the hub, and not for the apps Start manages.

## Cutting a release that includes the package

`node scripts/release.mjs start --tag start-v<version> --publish` from `suite-dev`. It writes a
PKGBUILD whose `pkgver` and `sha256sums` come from the artifact it just built — a stale checksum would
fail makepkg, which is the point — builds the package, and uploads it with the AppImage, the feed and
the signature.

An app with no `packaging/arch/PKGBUILD`, or a machine without `makepkg`, skips the package with a
note: only the hub has one.
