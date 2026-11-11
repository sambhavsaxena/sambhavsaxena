#!/usr/bin/env python3
"""Loudness curve and pause list for a WAV file.

Usage:
    python3 loudness_profile.py audio.wav [--hop 0.05] [--threshold -40] [--min-pause 0.5] [--json out.json]

Get the WAV first:  filmcraft-cli --project p.fcproj export audio.wav --format wav
(exports the active sequence; for a raw clip, make a sequence from it first).

Prints percentiles (to pick a threshold for this recording) and the pauses as start-end seconds.
With --json, also writes {"hop", "db": [...], "pauses": [[start, end], ...]} for other scripts.
Standard library only.
"""
import argparse
import array
import json
import math
import wave


def read_db_curve(path, hop_seconds):
    with wave.open(path) as w:
        rate, channels, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        if width != 2:
            raise SystemExit(f"expected 16-bit PCM, got {8 * width}-bit; export with --format wav")
        samples = array.array("h", w.readframes(w.getnframes()))
    hop = max(1, int(rate * hop_seconds)) * channels
    curve = []
    for i in range(0, len(samples), hop):
        chunk = samples[i:i + hop]
        rms = math.sqrt(sum(x * x for x in chunk) / len(chunk)) / 32768
        curve.append(20 * math.log10(rms + 1e-9))
    return curve


def find_pauses(curve, hop, threshold, min_pause):
    pauses, start = [], None
    for i, db in enumerate(curve + [0.0]):
        if db < threshold:
            start = i if start is None else start
            continue
        if start is not None and (i - start) * hop >= min_pause:
            pauses.append([round(start * hop, 3), round(i * hop, 3)])
        start = None
    return pauses


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("--hop", type=float, default=0.05)
    ap.add_argument("--threshold", type=float, default=-40.0, help="dBFS below which counts as silence")
    ap.add_argument("--min-pause", type=float, default=0.5)
    ap.add_argument("--json")
    args = ap.parse_args()

    curve = read_db_curve(args.wav, args.hop)
    ranked = sorted(curve)
    pct = {p: round(ranked[int(len(ranked) * p / 100)], 1) for p in (10, 50, 90)}
    print(f"duration {len(curve) * args.hop:.1f}s  p10 {pct[10]} dB  p50 {pct[50]} dB  p90 {pct[90]} dB")
    print("tip: speech sits near p50-p90; a threshold about halfway between p10 and p50 usually finds pauses")

    pauses = find_pauses(curve, args.hop, args.threshold, args.min_pause)
    total = sum(b - a for a, b in pauses)
    print(f"{len(pauses)} pauses >= {args.min_pause}s below {args.threshold} dB, {total:.1f}s total")
    print(" ".join(f"{a:.2f}-{b:.2f}" for a, b in pauses))

    if args.json:
        with open(args.json, "w") as f:
            json.dump({"hop": args.hop, "db": [round(v, 1) for v in curve], "pauses": pauses}, f)


if __name__ == "__main__":
    main()
