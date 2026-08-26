"""Bring every uploaded banner to one ratio so the carousel never resizes.

Pads (never crops) to TARGET, since these are designed banners with headline
text baked in. Flat edges get a solid fill; photographic edges get a mirrored,
blurred extension so there's no visible seam.
"""
import json, shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

TARGET = 2.40          # the ratio 4 of the 7 already use, so most are untouched
FLAT_STD = 18          # edge std below this = flat colour, safe to fill solid
UP = Path("backend/uploads")
BACKUP = UP / "_orig"
DRY = "--write" not in sys.argv


def extend(img, side, pad):
    """Build a `pad`-wide filler for one side: solid if flat, else mirror+blur."""
    w, h = img.size
    strip = img.crop((0, 0, min(pad, w), h)) if side == "L" \
        else img.crop((max(0, w - pad), 0, w, h))
    a = np.asarray(strip.convert("RGB")).astype(int)
    edge = a[:, :4] if side == "L" else a[:, -4:]

    if edge.reshape(-1, 3).std(0).max() < FLAT_STD:
        return Image.new("RGB", (pad, h), tuple(np.median(edge.reshape(-1, 3), 0).astype(int)))

    out = strip.transpose(Image.FLIP_LEFT_RIGHT).resize((pad, h), Image.LANCZOS)
    return out.filter(ImageFilter.GaussianBlur(max(6, pad * 0.20)))


reg = json.load(open("backend/src/data/db/hero.json"))
for i, u in enumerate(reg, 1):
    p = UP / Path(u["file"]).name
    img = Image.open(p).convert("RGB")
    w, h = img.size
    if abs(w / h - TARGET) < 0.01:
        print(f"{i}. {p.name[:24]}  {w}x{h}  already {TARGET} — untouched")
        continue

    tw = round(h * TARGET)
    lpad, rpad = (tw - w) // 2, tw - w - (tw - w) // 2
    canvas = Image.new("RGB", (tw, h))
    canvas.paste(extend(img, "L", lpad), (0, 0))
    canvas.paste(extend(img, "R", rpad), (tw - rpad, 0))
    canvas.paste(img, (lpad, 0))

    print(f"{i}. {p.name[:24]}  {w}x{h} ({w/h:.2f}) -> {tw}x{h} ({tw/h:.2f})  pad {lpad}+{rpad}px")
    if DRY:
        canvas.save(Path(__import__("os").environ["SCRATCH"]) / f"bn-{i}.png")
    else:
        BACKUP.mkdir(exist_ok=True)
        if not (BACKUP / p.name).exists():
            shutil.copy2(p, BACKUP / p.name)
        canvas.save(p)

print("DRY RUN — previews in scratch" if DRY else "WROTE IN PLACE (originals in uploads/_orig)")
