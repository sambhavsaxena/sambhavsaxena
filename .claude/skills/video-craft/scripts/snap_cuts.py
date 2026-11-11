#!/usr/bin/env python3
"""Move every segment boundary in a plan.json to the quietest point of the nearest gap between words.

Usage:
    python3 snap_cuts.py plan.json words.json audio.json      # rewrites plan.json, prints each move

words.json: transcribe.py output. audio.json: loudness_profile.py --json output (same source time).
Run it after choosing segments from the transcript and before plan_cuts.py, so no cut clips a word.
Where two words touch (no gap), the boundary is left alone and flagged: move it to a sentence end by hand.
"""
import json
import sys


def main():
    plan_path, words_path, audio_path = sys.argv[1:4]
    plan = json.load(open(plan_path))
    words = json.load(open(words_path))["words"]
    audio = json.load(open(audio_path))
    db, hop = audio["db"], audio["hop"]
    gaps = [(0.0, words[0]["start"])] + [(a["end"], b["start"]) for a, b in zip(words, words[1:])] \
        + [(words[-1]["end"], words[-1]["end"] + 2.0)]

    def nearest_gap(t):
        return min(gaps, key=lambda g: 0 if g[0] <= t <= g[1] else min(abs(t - g[0]), abs(t - g[1])))

    for seg in plan["segments"]:
        for edge in ("in", "out"):
            lo, hi = nearest_gap(seg[edge])
            hi = min(hi, lo + 2.0)
            if hi - lo < 0.04:
                print(f"{seg.get('name', '?'):8} {edge:3} {seg[edge]:8.2f}  words touch here: pick a sentence end by hand")
                continue
            i0, i1 = int(lo / hop), max(int(lo / hop) + 1, int(hi / hop))
            best = min(range(i0, min(i1, len(db))), key=lambda k: db[k])
            new = round(best * hop + hop / 2, 3)
            print(f"{seg.get('name', '?'):8} {edge:3} {seg[edge]:8.2f} -> {new:8.2f}  ({db[best]:.1f} dB)")
            seg[edge] = new
    json.dump(plan, open(plan_path, "w"), indent=1)


if __name__ == "__main__":
    main()
