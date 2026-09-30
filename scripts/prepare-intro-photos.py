#!/usr/bin/env python3
"""
v3 §2.7 — intro photo plates (Phase B).

Writes public/intro/<name>.webp for the six montage plates the intro uses
(design-workshop/intro-FINAL.html, plates p1..p6): ≤ 760 px on the long side,
WebP q80, never base64. lib/data/introAssets.ts is the manifest for them.

Sources (design-workshop/ is owner-private and git-ignored):
  badge, desk, door, neu_quad   ← intro-assets/<name>-duo.webp — the crimson
                                  duotone plates the intro embeds (byte-identical
                                  to its data URIs), only resized.
  schneider_office,             ← the CROPPED r2/assets crops, re-graded with the
  schneider_exora                 same crimson duotone. The intro embeds the
                                  UNCROPPED originals of these two, which must
                                  never ship (V3_SPEC §5), so the grade is fitted
                                  from an exact source/duotone pair
                                  (intro-assets/schneider_office.jpg vs
                                  schneider_office-duo.webp — same framing,
                                  straight resize) as a luminance → RGB lookup
                                  table, and applied to the crop region located
                                  in the original.

Run from the repo root:  python3 scripts/prepare-intro-photos.py
Requires Pillow (PIL) with WebP support. Idempotent: re-run to regenerate.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
WS = ROOT / "design-workshop"
INTRO = WS / "intro-assets"
R2 = WS / "screen-print" / "r2" / "assets"
OUT = ROOT / "public" / "intro"

MAX_LONG = 760  # px, long side
QUALITY = 80

# Plates that are the intro's own duotones, only resized.
STRAIGHT = ["badge", "desk", "door", "neu_quad"]
# Plates that must be re-graded from the cropped frames.
REGRADED = ["schneider_office", "schneider_exora"]
# The exact pair the grade is fitted from (same framing, straight resize).
FIT_SRC = INTRO / "schneider_office.jpg"
FIT_DUO = INTRO / "schneider_office-duo.webp"


def fit_size(w: int, h: int, max_long: int = MAX_LONG) -> tuple[int, int]:
    """Scale (w, h) so the long side is ≤ max_long, rounding the short side."""
    long = max(w, h)
    if long <= max_long:
        return w, h
    s = max_long / long
    return (max_long, round(h * s)) if w >= h else (round(w * s), max_long)


def resized(im: Image.Image) -> Image.Image:
    return im.resize(fit_size(*im.size), Image.LANCZOS)


def save_webp(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, "WEBP", quality=QUALITY, method=6)


def fit_lut(src_path: Path, duo_path: Path) -> list[list[int]]:
    """
    Fit a duotone as three 256-entry tables (R, G, B) indexed by the SOURCE
    luminance. The duotone is a function of luminance only, so the per-bin mean
    of the duo's RGB over source pixels with that luminance recovers it; empty
    bins are filled by linear interpolation.
    """
    duo = Image.open(duo_path).convert("RGB")
    src = Image.open(src_path).convert("RGB").resize(duo.size, Image.LANCZOS)
    lum = src.convert("L").getdata()
    sums = [[0, 0, 0] for _ in range(256)]
    counts = [0] * 256
    for l, (r, g, b) in zip(lum, duo.getdata()):
        s = sums[l]
        s[0] += r
        s[1] += g
        s[2] += b
        counts[l] += 1
    lut = [[0] * 256 for _ in range(3)]
    for ch in range(3):
        known = [(l, sums[l][ch] / counts[l]) for l in range(256) if counts[l] >= 8]
        if not known:
            raise SystemExit("fit_lut: no populated luminance bins")
        # extend the ends flat, interpolate the gaps
        pts = [(0, known[0][1])] + known + [(255, known[-1][1])]
        j = 0
        for l in range(256):
            while j + 1 < len(pts) and pts[j + 1][0] < l:
                j += 1
            l0, v0 = pts[j]
            l1, v1 = pts[min(j + 1, len(pts) - 1)]
            v = v0 if l1 == l0 else v0 + (v1 - v0) * (l - l0) / (l1 - l0)
            lut[ch][l] = max(0, min(255, round(v)))
    # report the fit
    fitted = apply_lut(src, lut)
    err = ImageStat.Stat(ImageChops.difference(fitted, duo).convert("L")).mean[0]
    print(f"  grade fitted from {src_path.name} → {duo_path.name}: mean |Δ| = {err:.2f}/255")
    return lut


def apply_lut(im: Image.Image, lut: list[list[int]]) -> Image.Image:
    gray = im.convert("L")
    return Image.merge("RGB", [gray.point(lut[ch]) for ch in range(3)])


def locate_crop(original: Image.Image, crop: Image.Image) -> tuple[int, int, int, int]:
    """
    Find where the (full-width, vertically cropped) frame sits in the original:
    scale the original to the crop's width and slide vertically for the least
    mean difference. Returns the crop box in ORIGINAL pixel coordinates.
    """
    scale = crop.width / original.width
    scaled = original.resize((crop.width, round(original.height * scale)), Image.LANCZOS)
    best = None
    for dy in range(0, scaled.height - crop.height + 1):
        window = scaled.crop((0, dy, crop.width, dy + crop.height))
        diff = ImageStat.Stat(ImageChops.difference(window, crop).convert("L")).mean[0]
        if best is None or diff < best[0]:
            best = (diff, dy)
    assert best is not None
    diff, dy = best
    print(f"  crop located at dy={dy}px (scaled), mean |Δ| = {diff:.2f}/255")
    if diff > 24:
        raise SystemExit("locate_crop: the cropped frame does not match the original")
    top = round(dy / scale)
    return (0, top, original.width, top + round(crop.height / scale))


def main() -> int:
    for p in [INTRO, R2, FIT_SRC, FIT_DUO]:
        if not p.exists():
            print(f"missing source: {p}", file=sys.stderr)
            return 1
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: list[tuple[str, int, int, int]] = []

    print("straight plates")
    for name in STRAIGHT:
        im = resized(Image.open(INTRO / f"{name}-duo.webp").convert("RGB"))
        out = OUT / f"{name}.webp"
        save_webp(im, out)
        manifest.append((name, im.width, im.height, out.stat().st_size))

    print("re-graded plates")
    lut = fit_lut(FIT_SRC, FIT_DUO)
    for name in REGRADED:
        original = Image.open(INTRO / f"{name}.jpg").convert("RGB")
        cropped_ref = Image.open(R2 / f"{name}.webp").convert("RGB")
        box = locate_crop(original, cropped_ref)
        plate = apply_lut(resized(original.crop(box)), lut)
        out = OUT / f"{name}.webp"
        save_webp(plate, out)
        manifest.append((name, plate.width, plate.height, out.stat().st_size))

    print("\nwritten (name, width, height, bytes) — mirror in lib/data/introAssets.ts:")
    total = 0
    for name, w, h, size in manifest:
        assert max(w, h) <= MAX_LONG
        total += size
        print(f"  {name:18s} {w:4d} × {h:4d}  {size:7d} B")
    print(f"  total {total / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
