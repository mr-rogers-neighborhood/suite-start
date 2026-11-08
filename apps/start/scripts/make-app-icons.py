#!/usr/bin/env python3
"""Regenerate `src/appIcons.ts` from each app's own artwork.

The hub shows the same mark an app shows: its `build/icon.svg` is the source, and the
64px data URI is what a card can draw without a new protocol path or a CSP change.

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

here = Path(__file__).resolve().parent
hub = here.parent
siblings = hub.parent.parent

entries = []
for name in ("canvas", "planner", "budget"):
    svg = siblings / f"suite-{name}" / "apps" / "desktop" / "build" / "icon.svg"
    if not svg.exists():
        raise SystemExit(f"missing artwork: {svg}")

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

    buffer = io.BytesIO()
    canvas.resize((CARD, CARD), Image.LANCZOS).save(buffer, format="PNG")
    entries.append((name, base64.b64encode(buffer.getvalue()).decode()))

lines = [
    "/**",
    " * The mark each app carries, as a data URI small enough to sit in a source file.",
    " *",
    " * Generated from each app's own `build/icon.svg`: the AppImage, the desktop entry and the",
    " * card all show the same artwork, so an app is recognisable wherever a person meets it.",
    " * Regenerate with `python3 apps/start/scripts/make-app-icons.py`.",
    " */",
    "export const APP_ICONS: Readonly<Record<string, string>> = {",
]
lines.extend(f'  {name}: "data:image/png;base64,{payload}",' for name, payload in entries)
lines.extend(["};", ""])

out = hub / "src" / "appIcons.ts"
out.write_text("\n".join(lines))
print(f"wrote {out} ({out.stat().st_size} bytes)")
