#!/usr/bin/env python3
"""Turn an edit plan into FilmCraft placement commands.

Usage:
    python3 plan_cuts.py plan.json            # writes segments.json and place.jsonl next to plan.json

plan.json:
{
  "item": 1,                      # FilmCraft project item id of the source clip
  "fps": 30,
  "width": 1920, "height": 1080,  # sequence size (1080x1920 for vertical)
  "sequence": "Edit",
  "pauses": "audio.json",         # optional: output of loudness_profile.py --json, in SOURCE time
  "pad": 0.15,                    # silence kept on each side of a tightened pause (seconds)
  "min_cut": 0.2,                 # skip removals shorter than this
  "segments": [                   # source ranges in the order they should play
    {"name": "hook",  "in": 141.2, "out": 147.9, "kind": "face"},
    {"name": "intro", "in": 1.4,   "out": 16.55, "kind": "face",   "tighten": true},
    {"name": "demo",  "in": 17.7,  "out": 68.85, "kind": "screen", "tighten": true}
  ]
}

Segments may be reordered (a cold open moved to the front is just a segment listed first).
"tighten": true removes the inside of each pause, keeping `pad` on both sides, so the cut lands in silence.
`kind` is free text that later passes use (for example: punch in only on "face", dissolve only on "screen").

Then:  filmcraft-cli --project p.fcproj --save run place.jsonl --compact
"""
import json
import os
import sys


def snap(t, fps):
    return round(t * fps) / fps


def tighten(seg, pauses, pad, min_cut, fps):
    if not seg.get("tighten") or not pauses:
        return [seg]
    pieces, cursor = [], seg["in"]
    for a, b in pauses:
        cut_in, cut_out = snap(a + pad, fps), snap(b - pad, fps)
        inside = seg["in"] + 0.3 < cut_in and cut_out < seg["out"] - 0.3
        if not inside or cut_out - cut_in < min_cut:
            continue
        pieces.append({**seg, "in": cursor, "out": cut_in})
        cursor = cut_out
    pieces.append({**seg, "in": cursor, "out": seg["out"]})
    return pieces


def main():
    plan_path = sys.argv[1]
    base = os.path.dirname(os.path.abspath(plan_path))
    plan = json.load(open(plan_path))
    fps = plan.get("fps", 30)
    pauses = []
    if plan.get("pauses"):
        pauses = json.load(open(os.path.join(base, plan["pauses"])))["pauses"]

    segments = []
    for seg in plan["segments"]:
        segments += tighten(seg, pauses, plan.get("pad", 0.15), plan.get("min_cut", 0.2), fps)

    commands = [{"id": "file.newSequence", "params": {
        "name": plan.get("sequence", "Edit"), "width": plan.get("width", 1920),
        "height": plan.get("height", 1080), "fps": fps, "video": 3, "audio": 3}}]
    t = 0.0
    for seg in segments:
        dur = snap(seg["out"] - seg["in"], fps)
        seg["edit_start"], seg["edit_end"] = round(t, 4), round(t + dur, 4)
        commands.append({"id": "timeline.place", "params": {
            "item": plan["item"], "track": "V1", "audioTrack": "A1", "seconds": round(t, 6),
            "insert": False, "sourceIn": {"seconds": round(seg["in"], 6)},
            "duration": {"seconds": round(dur, 6)}}})
        t = snap(t + dur, fps)

    json.dump(segments, open(os.path.join(base, "segments.json"), "w"), indent=1)
    with open(os.path.join(base, "place.jsonl"), "w") as f:
        f.writelines(json.dumps(c) + "\n" for c in commands)
    source = sum(s["out"] - s["in"] for s in plan["segments"])
    print(f"{len(segments)} segments, {t:.1f}s edit from {source:.1f}s of selected source")


if __name__ == "__main__":
    main()
