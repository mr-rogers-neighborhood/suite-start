#!/usr/bin/env python3
"""Regenerate `src/appIcons.ts` and `build/app-icons/` from each app's own artwork.

Two sizes of the same picture, for two different readers:

- **64px data URIs** (`src/appIcons.ts`) are what a card in the hub draws. They ride in the
  source file so a card needs no new protocol path and no CSP change.
- **256px PNGs** (`build/app-icons/<id>.png`) are what a menu entry points at. `Icon=` names
  a theme icon, so the file has to be a real one in the hicolor theme at the size its folder
  claims — 256 into `256x256/apps`, not the 1024 source scaled by whoever reads it.

Both come from the same render, so a card, a window and a menu entry cannot drift apart.

    python3 apps/start/scripts/make-app-icons.py

Needs `rsvg-convert` and Pillow, and the sibling repositories checked out beside this one —
the same assumption `suite-dev` makes for everything else.
"""
import base64
import io
import subprocess
from pathlib import Path

INK = (22, 22, 26, 255)  # #16161a, the hub's own --ink
SIZE = 1024
CARD = 64
MENU = 256

here = Path(__file__).resolve().parent
hub = here.parent
# apps/start -> apps -> suite-start -> the folder the sibling repositories sit in.
siblings = hub.parent.parent.parent

# An app's buildResources directory is not the same name twice: Canvas and the hub call it
# `build`, Planner and Budget call it `resources`. Guessing one shipped Electron's default
# icon for two apps while their artwork sat unread in the other folder.
BUILD_DIRS = ("build", "resources")


def artwork(name: str) -> Path:
    for directory in BUILD_DIRS:
        candidate = siblings / f"suite-{name}" / "apps" / "desktop" / directory / "icon.svg"
        if candidate.exists():
            return candidate
    raise SystemExit(f"missing artwork for {name} in any of {BUILD_DIRS}")


menu_dir = hub / "build" / "app-icons"
menu_dir.mkdir(parents=True, exist_ok=True)

entries = []
for name in ("canvas", "planner", "budget"):
    svg = artwork(name)

    png = subprocess.run(
        ["rsvg-convert", "-w", str(SIZE), "-h", str(SIZE), str(svg)],
        check=True,
        capture_output=True,
    ).stdout

    from PIL import Image, ImageDraw

    glyph = Image.open(io.BytesIO(png)).convert("RGBA")
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    inset = int(SIZE * 0.055)
    draw.rounded_rectangle(
        [inset, inset, SIZE - inset, SIZE - inset], radius=int(SIZE * 0.22), fill=INK
    )
    target = int(SIZE * 0.56)
    canvas.alpha_composite(
        glyph.resize((target, target), Image.LANCZOS),
        ((SIZE - target) // 2, (SIZE - target) // 2),
    )

    menu_path = menu_dir / f"{name}.png"
    canvas.resize((MENU, MENU), Image.LANCZOS).save(menu_path, format="PNG")

    buffer = io.BytesIO()
    canvas.resize((CARD, CARD), Image.LANCZOS).save(buffer, format="PNG")
    entries.append((name, base64.b64encode(buffer.getvalue()).decode()))

lines = [
    "/**",
    " * The mark each app carries, as a data URI small enough to sit in a source file.",
    " *",
    " * Generated from each app's own `build/icon.svg` — the AppImage, the desktop entry and the",
    " * card all show the same artwork, so a person recognises an app wherever they meet it.",
    " * Regenerate with `python3 apps/start/scripts/make-app-icons.py`.",
    " */",
    "export const APP_ICONS: Readonly<Record<string, string>> = {",
]
lines.extend(f'  {name}: "data:image/png;base64,{payload}",' for name, payload in entries)
lines.extend(["};", ""])

out = hub / "src" / "appIcons.ts"
out.write_text("\n".join(lines))
print(f"wrote {out} ({out.stat().st_size} bytes)")
print(f"wrote {menu_dir} ({len(entries)} icons at {MENU}px)")

