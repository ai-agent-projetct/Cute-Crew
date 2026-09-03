"""Turn the logo animation video into the site's logo assets.

The source renders red-and-white tiles on a light grey card (~244,244,244) with
soft drop shadows. Left as-is that grey reads as a box against the site's white
header, so the backdrop is keyed out to transparency.

Colour distance alone cannot do it — the white tiles sit only ~11 levels from the
grey backdrop and would go see-through. So the backdrop is found by flood-filling
inward from the frame edge: the tiles are interior and stay opaque no matter how
close their colour is.

Outputs: animated logo.webp (alpha), animated logo.gif (white matte, since GIF
transparency is 1-bit and would fringe), static logo.png, and favicon.png.
"""
import os, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

S = Path(os.environ["S"])
FRAMES = sorted((S / "frames").glob("*.png"))
OUT = Path("frontend/assets/img")
TOL = 26          # how far from the backdrop colour still counts as backdrop
FEATHER = 1.0     # px, softens the keyed edge
FPS = 10          # frames were sampled at this rate; a slow float needs no more
TARGET_H = 180    # ~2x the 96px the logo ever renders at, so it stays crisp
PAD = 8
MIN_BLOB = 0.0004 # drop compression specks, else they stretch the crop box
SEGMENT = 20      # forward frames before the ping-pong turns around


def alpha_for(rgb):
    """Alpha mask: 0 on the edge-connected backdrop, 1 on the logo."""
    a = rgb.astype(int)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, 0)

    near = np.abs(a - bg).max(2) <= TOL
    lab, n = ndimage.label(near)
    edge_ids = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
    edge_ids.discard(0)
    backdrop = np.isin(lab, list(edge_ids))
    # border_value=1: treat outside the frame as backdrop too, otherwise the
    # erosion half of the closing eats a 1px ring at the edge and leaves it opaque.
    backdrop = ndimage.binary_closing(backdrop, np.ones((3, 3)), border_value=1)

    al = ndimage.gaussian_filter((~backdrop).astype(np.float32), FEATHER)
    al = np.clip((al - 0.35) / 0.45, 0, 1)

    # Video compression leaves specks in the backdrop. They are invisible, but a
    # single one near the frame edge would stretch the shared crop box to the
    # whole frame, so drop anything far too small to be part of the mark.
    lab, n = ndimage.label(al > 0.05)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s / lab.size >= MIN_BLOB])
        al *= keep
    return al


print(f"keying {len(FRAMES)} frames…", flush=True)
cut = []
for i, f in enumerate(FRAMES):
    rgb = np.asarray(Image.open(f).convert("RGB"))
    a = alpha_for(rgb)
    cut.append(np.dstack([rgb, (a * 255).round().astype(np.uint8)]))
    if i % 30 == 0:
        print(f"  {i}/{len(FRAMES)}", flush=True)

# The source is a continuous 3D drift, not a loop — it never returns to its start
# (measured: the closest later frame is still ~19/255 away), so any straight cut
# jumps on repeat. Ping-pong instead: play forward, then back. That is seamless by
# construction, and using a short forward run keeps the file no bigger than a cut.
fwd = cut[:SEGMENT]
cut = fwd + fwd[-2:0:-1]          # drop both endpoints so neither is held twice
print(f"ping-pong loop: {len(fwd)} forward + {len(cut) - len(fwd)} back "
      f"= {len(cut)} frames ({len(cut) / FPS:.1f}s), seamless")

# One crop box for every frame — a per-frame crop would make the logo jitter.
union = np.zeros(cut[0].shape[:2], bool)
for c in cut:
    union |= c[..., 3] > 12
ys, xs = np.where(union)
box = (max(0, xs.min() - PAD), max(0, ys.min() - PAD),
       min(union.shape[1], xs.max() + PAD), min(union.shape[0], ys.max() + PAD))
print(f"content box {box}  ({box[2]-box[0]}x{box[3]-box[1]})")

scale = TARGET_H / (box[3] - box[1])
size = (round((box[2] - box[0]) * scale), TARGET_H)
imgs = [Image.fromarray(c[box[1]:box[3], box[0]:box[2]]).resize(size, Image.LANCZOS)
        for c in cut]
print(f"output size {size[0]}x{size[1]}")

dur = 1000 // FPS  # ms per frame at the rate the frames were sampled at

# This loads on every page, so it is tuned for weight: method=6 spends encoder
# time to save bytes, and the mark is flat colour so it survives a low quality.
imgs[0].save(OUT / "logo.webp", format="WEBP", save_all=True, append_images=imgs[1:],
             duration=dur, loop=0, lossless=False, quality=62, method=6)

# GIF transparency is 1-bit, which fringes on an anti-aliased edge — the logo only
# ever sits on white, so matte it rather than key it. Two flat brand colours plus
# anti-aliasing means a small shared palette is plenty and keeps the file honest.
flat = []
for im in imgs:
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    flat.append(bg.quantize(colors=48, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG))
flat[0].save(OUT / "logo.gif", format="GIF", save_all=True, append_images=flat[1:],
             duration=dur, loop=0, optimize=True, disposal=2)

imgs[0].save(OUT / "logo.png")            # static fallback, keeps alpha

# Favicon: the bunny "u". Found rather than hardcoded — its ears are the only part
# of the mark reaching the very top, which pins its columns. It is tall and narrow,
# so a square crop would drag in the letters either side; take its exact box and
# pad to square on transparency instead.
al = np.asarray(imgs[0])[..., 3] > 40
h, w = al.shape
tops = np.array([np.where(al[:, x])[0][0] if al[:, x].any() else h for x in range(w)])
ears = np.where(tops < h * 0.12)[0]
x0, x1 = ears.min(), ears.max()
ys = np.where(al[:int(h * 0.55), x0:x1 + 1].any(1))[0]
bunny = imgs[0].crop((x0, ys.min(), x1 + 1, ys.max() + 1))

side = int(max(bunny.size) * 1.10)
fav = Image.new("RGBA", (side, side), (0, 0, 0, 0))
fav.paste(bunny, ((side - bunny.width) // 2, (side - bunny.height) // 2))
fav.resize((64, 64), Image.LANCZOS).save(OUT / "favicon.png")

for f in ["logo.webp", "logo.gif", "logo.png", "favicon.png"]:
    print(f"  {f:14s} {(OUT / f).stat().st_size // 1024:>5} KB")
