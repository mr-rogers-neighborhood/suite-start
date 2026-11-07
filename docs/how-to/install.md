# Installing Suite Start

Suite Start is the hub: one window that installs, updates and opens the other apps in the suite. It is
the only piece you fetch by hand — every other app arrives through it.

## 0. On Arch, use the package (shortest path)

The release also carries an Arch package, which installs the hub under `/opt` with a menu entry and
**no FUSE requirement at all**:

```sh
curl -LO https://github.com/mr-rogers-neighborhood/suite-start/releases/latest/download/suite-start-bin-0.3.0-1-x86_64.pkg.tar.zst
sudo pacman -U suite-start-bin-0.3.0-1-x86_64.pkg.tar.zst
```

Then start **Suite Start** from your application menu, or run `suite-start`. A new hub version arrives
the same way: download the newer package from its release and `pacman -U` it. The hub cannot update
itself, and says so on its own row.

[Packaging: four forms, and which one is for what](package.md) explains why the hub is packaged while
the apps it installs stay AppImages.

## 1. Download (the AppImage, for every other distribution)

Open the [latest release](https://github.com/mr-rogers-neighborhood/suite-start/releases/latest) and
download:

- `suite-start-<version>-x86_64.AppImage` — the app, one file;
- `latest-linux.yml` — what the updater reads, and what you can check the file against.

Linux is the only platform with a published build. macOS and Windows are configured but have no
signing identity yet, so there is nothing to download for them.

## 2. Check the download (a minute, once)

The yml names the file and its SHA-512. Compare it before you run anything:

```sh
sha512sum suite-start-0.3.0-x86_64.AppImage
```

The value must match the `sha512:` beside the file name in `latest-linux.yml`. This is the same check
Start makes on every app it installs.

## 3. Make it runnable

```sh
chmod +x suite-start-0.3.0-x86_64.AppImage
```

An AppImage needs FUSE 2 to mount itself. Many distributions no longer install it by default, and
without it you get `dlopen(): error loading libfuse.so.2`. Two answers, either is fine:

```sh
# install FUSE 2
sudo pacman -S fuse2          # Arch
sudo apt install libfuse2     # Debian, Ubuntu
sudo dnf install fuse         # Fedora

# or run it without FUSE, which extracts and starts in one step
./suite-start-0.3.0-x86_64.AppImage --appimage-extract-and-run
```

## 4. Open it

```sh
./suite-start-0.3.0-x86_64.AppImage
```

You get one window with a card per app the suite offers:

| What the card says                  | What it means                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| **Install Suite Canvas**            | A release is published and verified; one press downloads it.                   |
| **No release found**                | Nothing is published for that app yet. The button appears when a version does. |
| **0.1.0 · up to date**              | Installed, and the published version is the one you have.                      |
| **0.1.0 · newer version available** | Installed, with **Update to …** as the main button.                            |

A download shows a bar **on the card**, in place of the button, and a failure says what went wrong in
the same place. Nothing installs itself: Start reads a version when the window opens, and fetches a
file only when you press something.

The last row is Start itself. It cannot replace its own running binary, so when a newer Start exists
that row links to the release page instead of offering a button.

## 5. Where things go

- Installs: `~/Applications/Suite/<App>/<version>/` — the binary, a `suite.app.json` Start wrote for
  it, and nothing else. An update adds the new version, then removes the old one.
- Start's own records: `installs.json` in Start's data directory (`~/.local/share/suite/start` on
  Linux). It is the only place an executable path lives.
- Documents stay in `~/Documents/Suite/<App>`. Start never opens or edits them.

**Remove** on a card forgets the install without deleting the files; delete the app's folder under
`~/Applications/Suite` to free the space.

## 6. What is published today

Suite Canvas 0.1.0, so that card offers **Install**. Suite Planner and Suite Budget have no published
release yet, and say so rather than hiding the card.

## 7. If something goes wrong

- `libfuse.so.2` — see step 3; it is the most common first failure.
- "the manifest is not signed by the publisher" on a card — the feed it reads is not signed with the
  key Start has pinned. That is a refusal, not a bug, and nothing is downloaded.
- A card that never leaves "Not installed yet" after a press — the download failed; the sentence on
  the card is the reason, and the previous install (if any) is untouched.
