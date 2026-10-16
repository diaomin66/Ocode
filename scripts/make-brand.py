#!/usr/bin/env python3
"""Generate Ocode's geometric O/slash brand masters without external services.

Run this before make-icon.py and make-dmg-background.py. Historical screenshots
are deliberately not rewritten. The mark uses no font or third-party artwork.
"""
from pathlib import Path
import math

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SIZE = 1024
INK = (32, 33, 36, 255)
PAPER = (249, 249, 247, 255)


def mark(color: tuple[int, int, int, int]) -> Image.Image:
    scale = 3
    image = Image.new("RGBA", (SIZE * scale, SIZE * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(tuple(n * scale for n in (210, 200, 814, 824)), radius=190 * scale, outline=color, width=90 * scale)
    draw.line(tuple(n * scale for n in (440, 650, 584, 374)), fill=color, width=70 * scale)
    for x, y in [(440, 650), (584, 374)]:
        draw.ellipse(((x - 35) * scale, (y - 35) * scale, (x + 35) * scale, (y + 35) * scale), fill=color)
    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    light_mark, dark_mark = mark(INK), mark(PAPER)
    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)
    draw.rounded_rectangle((24, 24, 1000, 1000), radius=220, fill=PAPER, outline=(218, 219, 216, 255), width=3)
    tile.alpha_composite(light_mark)
    outputs = {
        "apps/desktop/build/icon_1024.png": tile,
        "apps/desktop/build/logo_dark.png": dark_mark,
        "apps/desktop/src/assets/brand/logo-light.png": light_mark.resize((192, 192), Image.Resampling.LANCZOS),
        "apps/desktop/src/assets/brand/logo-dark.png": dark_mark.resize((192, 192), Image.Resampling.LANCZOS),
        "docs/public/app-icon.png": tile,
        "docs/image/readme/logo-ocode.png": tile,
    }
    for relative, image in outputs.items():
        image.save(ROOT / relative, optimize=True)
        print(f"wrote {relative}")
    # Match the existing reduced-motion switch with paired GIF/still assets.
    for theme, source in [("light", light_mark), ("dark", dark_mark)]:
        still = source.resize((200, 200), Image.Resampling.LANCZOS)
        still.save(ROOT / f"apps/desktop/src/assets/home-mascot-still-{theme}.png", optimize=True)
        frames = []
        for index in range(24):
            angle = 3 * math.sin(index * 2 * math.pi / 24)
            frame = still.rotate(angle, resample=Image.Resampling.BICUBIC)
            mask = frame.getchannel("A").point(lambda alpha: 255 if alpha < 128 else 0)
            palette = frame.convert("RGB").quantize(colors=255)
            palette.paste(255, mask=mask)
            frames.append(palette)
        frames[0].save(ROOT / f"apps/desktop/src/assets/home-mascot-{theme}.gif", save_all=True,
                       append_images=frames[1:], duration=100, loop=0, transparency=255, disposal=2)
        print(f"wrote home-mascot {theme} motion/still assets")


if __name__ == "__main__":
    main()
