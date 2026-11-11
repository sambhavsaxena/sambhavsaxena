#!/usr/bin/env python3
"""Tile frame PNGs into labelled contact sheets so a whole video can be read as a few images.

Usage:
    uv run --with pillow python contact_sheet.py FRAMES_DIR OUT_DIR [--cols 8] [--per-sheet 40]

Frames must be named t<seconds>.png (sample_frames.sh does this); the label is taken from the name.
Read the sheets with the Read tool to spot shot changes, camera flips, dead air and framing problems.
"""
import argparse
import glob
import os

from PIL import Image, ImageDraw, ImageFont


def label_for(path):
    stem = os.path.basename(path)[1:-4]
    try:
        return f"{float(stem):g}"
    except ValueError:
        return stem


def build(frames, out_path, cols):
    w, h = Image.open(frames[0]).size
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * h), "black")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=max(14, h // 9))
    for i, path in enumerate(frames):
        x, y = (i % cols) * w, (i // cols) * h
        sheet.paste(Image.open(path).convert("RGB"), (x, y))
        text = label_for(path) + "s"
        box = draw.textbbox((x + 4, y + 2), text, font=font)
        draw.rectangle([x, y, box[2] + 4, box[3] + 2], fill="black")
        draw.text((x + 4, y + 2), text, fill="yellow", font=font)
    sheet.save(out_path, quality=80)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--cols", type=int, default=8)
    ap.add_argument("--per-sheet", type=int, default=40)
    args = ap.parse_args()

    frames = sorted(glob.glob(os.path.join(args.frames_dir, "t*.png")))
    if not frames:
        raise SystemExit(f"no t*.png frames in {args.frames_dir}")
    os.makedirs(args.out_dir, exist_ok=True)
    for start in range(0, len(frames), args.per_sheet):
        out = os.path.join(args.out_dir, f"sheet_{start:04d}.jpg")
        build(frames[start:start + args.per_sheet], out, args.cols)
        print(out)


if __name__ == "__main__":
    main()
