"""Set product-photo backdrops: white for the display frame, grey for the hover frame.

Matches miniklub, whose catalogue frames are shot on white; the grey is reserved
for the second (hover) frame so the swap reads as a deliberate change.

Runs off the saved alpha cut-outs, so it is a re-composite (seconds), not a
re-matte (many minutes). Sources:
  real/*-cut.png        48 garment cut-outs      -> their plain photo
  real/matted/*.png     16 editorial cut-outs    -> same name
  real/matted-mk/*.png  90 miniklub cut-outs     -> mk-<id>.png / mk-<id>-b.png
"""
import sys, time
from pathlib import Path
from PIL import Image

REAL = Path("frontend/assets/img/real")
WHITE = (255, 255, 255)      # display frame
GREY = (241, 241, 241)       # hover frame, sampled from miniklub
DRY = "--write" not in sys.argv


def flatten(src, bg, dest):
    im = Image.open(src).convert("RGBA")
    out = Image.new("RGB", im.size, bg)
    out.paste(im, mask=im.getchannel("A"))
    if DRY:
        return dest.name
    # Windows hands back EINVAL when a virus scanner still holds the file it
    # just saw written — retry rather than abandoning the run halfway through.
    for attempt in range(6):
        try:
            out.save(dest)
            return dest.name
        except OSError:
            if attempt == 5:
                raise
            time.sleep(0.4 * (attempt + 1))


done = {"white": 0, "grey": 0}

# 48 garment cut-outs + 16 editorial cut-outs -> display frames, white
for cut in sorted(REAL.glob("*-cut.png")):
    plain = REAL / cut.name.replace("-cut.png", ".png")
    if plain.exists():
        flatten(cut, WHITE, plain); done["white"] += 1

for cut in sorted((REAL / "matted").glob("*.png")):
    flatten(cut, WHITE, REAL / cut.name); done["white"] += 1

# miniklub: display frame white, hover frame grey
for cut in sorted((REAL / "matted-mk").glob("*.png")):
    hover = cut.stem.endswith("-b")
    flatten(cut, GREY if hover else WHITE, REAL / cut.name)
    done["grey" if hover else "white"] += 1

print(("DRY RUN — nothing written" if DRY else "WROTE IN PLACE"))
print(f"  display frames on white : {done['white']}")
print(f"  hover frames on grey    : {done['grey']}")
