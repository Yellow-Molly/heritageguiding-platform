#!/usr/bin/env python3
"""Convert guide profile photos to web-standard JPEGs.

Reads from docx/Guide-photos/ and writes to docx/Guide-photos-web/.
Resizes so longest side <= 1600px, re-encodes JPEG quality 85, strips EXIF.
Mats Quist photo (already low-res 430x640) is copied as-is and flagged.
Mattias Wallin 1.jpeg is ignored (no schema slot for second photo).

Usage:
    ~/.claude/skills/.venv/Scripts/python.exe scripts/convert-guide-photos-for-web.py
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "docx" / "Guide-photos"
DST_DIR = ROOT / "docx" / "Guide-photos-web"

MAX_SIDE = 1600
QUALITY = 85

# (source_filename, output_filename) — output normalized to kebab-case + .jpg
TARGETS = [
    ("Anders_Boysen.jpeg",      "anders-boysen.jpg"),
    ("Annika_Bernholm.jpg",     "annika-bernholm.jpg"),
    ("Anette Gustafsson.JPG",   "anette-gustafsson.jpg"),
    ("Asa_Ovrelid.jpg",         "asa-ovrelid.jpg"),
    ("Jack Voldstad.jpg",       "jack-voldstad.jpg"),
    ("Leo Eriksson.JPG",        "leo-eriksson.jpg"),
    ("Sophie_Sahlin.jpeg",      "sophie-sahlin.jpg"),
    ("Svante Bergqvist.jpeg",   "svante-bergqvist.jpg"),
    ("Tommy Nilsson.jpg",       "tommy-nilsson.jpg"),
]

# Files copied without re-encoding (already small enough; flagged for report)
SKIP_AS_IS = [
    ("Mats Quist.jpeg", "mats-quist.jpg", "low-res 430x640 — flagged"),
]


def fmt_kb(p: Path) -> str:
    return f"{p.stat().st_size / 1024:.0f}KB"


def convert_one(src: Path, dst: Path) -> tuple[tuple[int, int], tuple[int, int]]:
    img = Image.open(src)
    before = img.size
    # Drop alpha if present so JPEG saves cleanly
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")
    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    # save without EXIF (PIL drops it by default unless explicitly passed)
    img.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return before, img.size


def main() -> int:
    if not SRC_DIR.is_dir():
        print(f"ERROR: source dir not found: {SRC_DIR}")
        return 1
    DST_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Source: {SRC_DIR}")
    print(f"Output: {DST_DIR}")
    print(f"Max side: {MAX_SIDE}px, JPEG quality: {QUALITY}\n")

    print(f"{'File':<28}{'Before':<24}{'After':<24}{'Size':<12}{'Note'}")
    print("-" * 100)

    converted = 0
    for src_name, dst_name in TARGETS:
        src_p = SRC_DIR / src_name
        if not src_p.is_file():
            print(f"{src_name:<28}MISSING")
            continue
        dst_p = DST_DIR / dst_name
        before_kb = fmt_kb(src_p)
        before_dim, after_dim = convert_one(src_p, dst_p)
        after_kb = fmt_kb(dst_p)
        before_str = f"{before_dim[0]}x{before_dim[1]} {before_kb}"
        after_str = f"{after_dim[0]}x{after_dim[1]} {after_kb}"
        print(f"{src_name:<28}{before_str:<24}{after_str:<24}{'':<12}converted")
        converted += 1

    for src_name, dst_name, note in SKIP_AS_IS:
        src_p = SRC_DIR / src_name
        if not src_p.is_file():
            print(f"{src_name:<28}MISSING")
            continue
        dst_p = DST_DIR / dst_name
        # Copy, then re-save with same quality flag set (still strip EXIF) to be safe
        img = Image.open(src_p).convert("RGB")
        img.save(dst_p, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        before_str = f"{Image.open(src_p).size[0]}x{Image.open(src_p).size[1]} {fmt_kb(src_p)}"
        after_str = f"{img.size[0]}x{img.size[1]} {fmt_kb(dst_p)}"
        print(f"{src_name:<28}{before_str:<24}{after_str:<24}{'':<12}{note}")
        converted += 1

    print(f"\nDone: {converted} files in {DST_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
