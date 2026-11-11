#!/bin/bash
# Render frames from a FilmCraft project's active sequence at a fixed step.
#
# Usage: sample_frames.sh PROJECT.fcproj OUT_DIR START END [STEP=1] [SCALE=0.2]
#   whole video, 1 per second:   sample_frames.sh edit.fcproj frames 0 229
#   zoom on a moment:            sample_frames.sh edit.fcproj fine 15.6 19.4 0.2 0.15
#
# Files are named t<seconds>.png so contact_sheet.py can label them. About 100 ms per frame.
set -euo pipefail
project="$1"; out="$2"; start="$3"; end="$4"; step="${5:-1}"; scale="${6:-0.2}"
mkdir -p "$out"
times=$(python3 -I -c "
s, e, st = $start, $end, $step
n = int(round((e - s) / st))
print(' '.join(f'{s + i * st:.2f}' for i in range(n + 1)))")
for t in $times; do
  name=$(printf "t%07.2f.png" "$t")
  filmcraft-cli --project "$project" render --seconds "$t" --out "$out/$name" --scale "$scale" >/dev/null 2>&1 \
    || echo "failed at ${t}s" >&2
done
ls "$out" | wc -l | xargs echo "frames:"
