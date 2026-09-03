"""Rebuild the miniklub-sourced product shots: new backdrop + a hover image.

Each catalogue entry is matched back to its source product by name, so the hover
frame is guaranteed to be another angle of the SAME garment. Both frames are
matted, trimmed and re-centred on one 4:5 canvas.

The alpha cut-outs are kept in real/matted-mk/, so changing GREY later is a
re-composite (seconds) instead of a re-matte (many minutes).
"""
import json, os, re, sys, glob, urllib.request
from io import BytesIO
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image
from scipy import ndimage
from rembg import new_session, remove

S = Path(os.environ["S"])
OUT = Path("frontend/assets/img/real")
ALPHA = OUT / "matted-mk"
GREY = (241, 241, 241)        # sampled from miniklub's own product frames
W, H = 960, 1200              # 4:5, matches the product card
MARGIN = 0.06
MIN_BLOB = 0.004


def short(title):
    t = re.sub(r"\s+", " ", title).strip()
    t = re.sub(r"^(Baby\s+)?(Girls|Boys)\s+", "", t, flags=re.I)
    t = re.sub(r"\bPack\s+Of\s+\d+\s*", "", t, flags=re.I)
    t = re.split(r",| with | Regular Fit| Casual Wear", t, flags=re.I)[0]
    return " ".join(t.split()[:5]).strip(" -–&")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")


def standardise(cut):
    """Trim to the garment, scale to fit, centre on the grey canvas."""
    a = np.array(cut)
    lab, n = ndimage.label(a[..., 3] > 8)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s / lab.size >= MIN_BLOB])
        a[..., 3] *= keep
    cut = Image.fromarray(a)

    box = cut.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return None, None
    g = cut.crop(box)
    scale = min(W * (1 - 2 * MARGIN) / g.width, H * (1 - 2 * MARGIN) / g.height)
    g = g.resize((max(1, round(g.width * scale)), max(1, round(g.height * scale))), Image.LANCZOS)

    pad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pad.paste(g, ((W - g.width) // 2, (H - g.height) // 2))
    flat = Image.new("RGB", (W, H), GREY)
    flat.paste(pad, mask=pad.getchannel("A"))
    return flat, pad


# ---- match each catalogue row back to its source product ----
rows = re.findall(r"name: '([^']+)'.*?mk-(\d+)\.png",
                  open("backend/src/data/catalog.js", encoding="utf-8").read())
index = {}
for f in glob.glob(str(S / "mk-*.json")):
    for p in json.load(open(f, encoding="utf-8"))["products"]:
        index.setdefault(short(p["title"]).lower(), p)

jobs, missing = [], []
for name, pid in rows:
    p = index.get(name.lower())
    if not p or not p.get("images"):
        missing.append((pid, name)); continue
    imgs = [i["src"] for i in p["images"]]
    jobs.append((pid, imgs[0], imgs[1] if len(imgs) > 1 else None))

print(f"matched {len(jobs)}/{len(rows)} | unmatched: {missing}", flush=True)
ALPHA.mkdir(exist_ok=True)

# download first (network-bound, parallel), then matte (CPU-bound, serial)
def grab(j):
    pid, a, b = j
    return pid, fetch(a), (fetch(b) if b else None)

with ThreadPoolExecutor(8) as ex:
    downloaded = list(ex.map(grab, jobs))
print(f"downloaded {len(downloaded)} products", flush=True)

session = new_session("isnet-general-use")
for pid, ia, ib in downloaded:
    for suffix, im in (("", ia), ("-b", ib)):
        if im is None:
            continue
        cut = remove(im, session=session, alpha_matting=True,
                     alpha_matting_foreground_threshold=250,
                     alpha_matting_background_threshold=15,
                     alpha_matting_erode_size=8)
        flat, pad = standardise(cut)
        if flat is None:
            print(f"  mk-{pid}{suffix}: nothing matted", flush=True); continue
        flat.save(OUT / f"mk-{pid}{suffix}.png")
        pad.save(ALPHA / f"mk-{pid}{suffix}.png")
    print(f"  mk-{pid} done", flush=True)

print("REBUILD COMPLETE", flush=True)
