"""Regenerate the app icons in assets/ from the SVG masters in this folder.

macOS only: renders SVG with QuickLook (qlmanage). QuickLook drops transparency,
so the mark is rendered on black and on white and the alpha is recovered from
the difference. Run: python3 assets/brand/export_icons.py
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent
SIZE = 1024


def render(svg_text: str) -> np.ndarray:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "in.svg"
        src.write_text(svg_text)
        subprocess.run(["qlmanage", "-t", "-s", str(SIZE), "-o", tmp, str(src)], check=True, capture_output=True)
        return np.asarray(Image.open(Path(tmp) / "in.svg.png").convert("RGB"), dtype=np.float64)


def on_background(svg_text: str, color: str) -> str:
    open_end = svg_text.index(">", svg_text.index("<svg")) + 1
    return svg_text[:open_end] + f'<rect width="1024" height="1024" fill="{color}"/>' + svg_text[open_end:]


def render_transparent(svg_path: Path) -> Image.Image:
    svg = svg_path.read_text()
    black = render(on_background(svg, "#000000"))
    white = render(on_background(svg, "#FFFFFF"))
    alpha = 255.0 - (white - black).mean(axis=2)  # white - black = 255 * (1 - alpha)
    safe = np.maximum(alpha, 1.0)[..., None]
    rgb = np.clip(black * 255.0 / safe, 0, 255)  # un-premultiply
    rgba = np.dstack([rgb, np.clip(alpha, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def padded(mark: Image.Image, scale: float) -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    inner = round(SIZE * scale)
    canvas.alpha_composite(mark.resize((inner, inner), Image.LANCZOS), ((SIZE - inner) // 2, (SIZE - inner) // 2))
    return canvas


def main():
    mark = render_transparent(HERE / "logo-mark.svg")
    # iOS rejects icons with transparency, so the full icon is flattened RGB.
    icon = Image.fromarray(render((HERE / "logo.svg").read_text()).astype(np.uint8), "RGB")
    icon.save(ASSETS / "icon.png")
    icon.resize((512, 512), Image.LANCZOS).save(HERE / "play-store-icon-512.png")  # Play Console listing
    # Android adaptive icons crop to the centre ~61%; keep the mark inside it.
    padded(mark, 0.62).save(ASSETS / "adaptive-icon.png")
    mark.save(ASSETS / "splash-icon.png")
    padded(mark, 0.62).resize((48, 48), Image.LANCZOS).save(ASSETS / "favicon.png")
    print("wrote icon.png, adaptive-icon.png, splash-icon.png, favicon.png, brand/play-store-icon-512.png")


if __name__ == "__main__":
    main()
