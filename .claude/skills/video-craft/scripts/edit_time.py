#!/usr/bin/env python3
"""Map a source time (a word from the transcript) to edit time, using plan_cuts.py's segments.json.

Usage:
    python3 edit_time.py segments.json 146.12 149.64 154.44      # prints one edit time per source time

Import it to time graphics:  from edit_time import load, to_edit
A source time inside a removed stretch maps to where the next kept piece starts.
"""
import json
import sys


def load(path):
    return json.load(open(path))


def to_edit(segments, t):
    for s in segments:
        if s["in"] - 1e-6 <= t < s["out"]:
            return s["edit_start"] + (t - s["in"])
    later = [s["edit_start"] for s in segments if s["in"] > t]
    return min(later) if later else segments[-1]["edit_end"]


if __name__ == "__main__":
    segs = load(sys.argv[1])
    for arg in sys.argv[2:]:
        print(f"{float(arg):8.2f} -> {to_edit(segs, float(arg)):8.2f}")
