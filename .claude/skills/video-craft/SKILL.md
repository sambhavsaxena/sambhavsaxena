---
name: video-craft
description: Edit raw footage into a polished creator video, and build motion graphics for it, by driving the FilmCraft video editor and the EffectCraft motion graphics compositor (open-source, After Effects / Premiere-class, scriptable CLIs and MCP servers). Applies a researched playbook of hooks, cold opens, retention structure, jump-cut and J/L-cut craft, pause tightening, sound mixing to -14 LUFS, kinetic captions, lower thirds, callouts, and full-screen infographics that replace the picture while the voice keeps playing. Use this skill whenever the user wants to edit, cut, tighten, restructure, caption, add graphics or overlays to, fix, or export a video; turn a long video into a Short, Reel or TikTok; make a YouTube video "more engaging", "seamless" or "professional"; animate a stat, chart, list or title; or asks how to shoot or light a video, even if they never name FilmCraft or EffectCraft.
---

# Video craft

You are the editor. The user hands you footage and a goal; you return a finished, exported video and an
honest account of what you could and could not check. You work through two command-driven apps:

- **FilmCraft** (`filmcraft-cli`): the edit. Cuts, transitions, punch-ins, freezes, audio, captions,
  transcription, export.
- **EffectCraft** (`effectcraft-cli`): motion graphics. Lower thirds, kinetic captions, callouts,
  stat cards, charts, lists, title cards. Rendered as ProRes and placed in FilmCraft.

Read these when you need them:
- `references/playbook.md`: the rules with numbers (hook, pacing, sound, graphics, framing,
  platform presets, repair patterns, myths). Read it before planning any edit.
- `references/tools.md`: exact commands, JSX patterns and gotchas for both apps. Read it before your
  first command.
- `references/evidence.md`: the full research report with sources, for when the user asks "why" or
  a rule needs checking.

Bundled scripts (run them, do not rewrite them):
| Script | Does |
|---|---|
| `scripts/sample_frames.sh` | renders frames from a FilmCraft project at a fixed step |
| `scripts/contact_sheet.py` | tiles those frames into labelled sheets you can read |
| `scripts/loudness_profile.py` | 50 ms loudness curve and pause list from a WAV |
| `scripts/plan_cuts.py` | edit plan (ordered source ranges + pauses) -> FilmCraft placement JSONL |
| `scripts/make_graphic.py` | JSON spec -> rendered EffectCraft graphic (7 types) + preview frames |

Python scripts that need Pillow run with `uv run --with pillow python <script>`; the rest are
standard library.

## The one idea behind every decision

Viewers stay when something new keeps arriving and leave when the video stalls or breaks its promise.
So: **deliver the promise first, then make every cut, zoom, sound and graphic earn its place by adding
information.** Cutting fast on a timer is not pacing; MrBeast's team abandoned it in 2024. Hard
constraints (loudness, reading speed, safe areas, contrast, continuity, audio fades) are not negotiable.
Everything else is a taste default you state, apply, and let the user overrule.

## Workflow

### 0. Set up and agree the brief

Check `filmcraft-cli --version` and `effectcraft-cli --version`. If either is missing, follow
`references/tools.md` section 1, and ask before downloading anything.

Get the brief in a few words, asking only for what you cannot infer:
- platform and shape (YouTube 16:9, Shorts/Reels/TikTok 9:16, or both),
- what the video promises (title/thumbnail idea, or "what should someone feel or learn"),
- anything that must stay or go, and the style (calm explainer vs energetic).

If the user gave a clear instruction ("fix the camera flips, make it seamless"), start; do not interview.

Work in a project folder: source media stays where it is, and the project, plans, JSONL passes,
graphics and exports go in the folder. Never overwrite the user's source files.

### 1. Understand the footage

You cannot watch video or hear audio, so build a picture of it deliberately:
1. `filmcraft-cli probe <file>`: duration, fps, size, codec, audio.
2. Import, make a sequence from the clip, then a **contact sheet**: one frame per second
   (`sample_frames.sh ... 0 <duration> 1 0.2` then `contact_sheet.py`). Read every sheet. Note shot
   changes, camera flips, screen recordings, dead stretches, framing problems.
3. `clip.sceneEditDetection` for hard cuts; zoom in on suspicious moments at 0.2 s steps.
4. **Audio**: export WAV, run `loudness_profile.py` to get pauses and levels.
5. **Words**: a transcript makes every later step better (finding the hook, cutting on sentences,
   timing graphics, captions). FilmCraft transcribes locally with Whisper, but the model is a
   ~290 MB download: ask first. Without it, work from pauses and frames, and say so.

Write down a shot log: time ranges, what is in them (face, screen, b-roll, flip, dead air), and the
strongest moments.

### 2. Plan the story

Read `references/playbook.md` sections 2 and 3, then decide:
- **The opening.** Which moment best pays off the promise? Move it to the front as a cold open if it
  is not already there. Cut greetings, logos and setup that come before the promise.
- **The order.** Beats should join with "but" or "therefore". Drop or move "and then" beats.
- **The cuts.** Which ranges to keep, which pauses to tighten, which breaks need repair
  (playbook section 8: camera flips, shaky starts, false starts).
- **The interrupts.** Where the picture should change because there is new information: punch-ins at
  sentence starts, b-roll, callouts, full-screen graphics. Long-form: plan re-hooks near 22% and 44%.
- **The ending.** Hard cut soon after the payoff; for Shorts, loop back to frame 1.

Write the plan as `plan.json` for `plan_cuts.py` (ordered source segments with a `kind` per segment,
`tighten: true` where pauses should go). For anything beyond a simple tidy-up, show the user the
plan in plain words before building it: the opening, what gets cut, where graphics go.

### 3. Build the cut (pass 1)

`plan_cuts.py plan.json` writes `place.jsonl`. Dry-run it (`run place.jsonl` without `--save`), then
run it with `--save`. Inspect the sequence to get clip ids. Keep every pass as a JSONL file so the edit
is reviewable and re-runnable.

### 4. Polish (pass 2)

Generate a second JSONL from `seq.json` + `segments.json` (write a small script; ids come from the
inspect, never hard-coded):
- **Jump-cut hygiene**: alternate 100% / 110-115% scale at sentence starts on face shots; never on
  consecutive cuts; nudge position down so the head stays in frame.
- **Transitions**: straight cuts by default. Motivated transitions only: a whip on a camera flip or
  move, a short dissolve on handheld screen-recording jumps, dip to black at the very end.
- **J/L cuts** where a new shot or speaker begins: let audio lead or trail by 6-12 frames.
- **Freeze bridges** where speech continues over unusable picture.
- **Audio**: a 2-3 frame crossfade on every audio cut, dialogue cleanup, music ducked 12-20 dB.

### 5. Graphics

Read `references/playbook.md` section 5. For each graphic:
1. Decide overlay or replacement. Overlay keeps the face (lower third, callout, captions).
   Replacement covers the picture while the voice continues (stat, chart, list, title).
2. Time it to the narration: in and out on sentence boundaries, each element when the voice names it.
   Use the transcript's word times if you have them.
3. Write a spec and run `make_graphic.py spec.json`. The spec format for all seven types
   (lower_third, title_card, stat, bar_chart, list, captions, callout) is in the docstring at the top
   of the script. It renders the `.mov` (alpha for overlays) and three preview PNGs. **Read the
   previews** and fix anything off before placing it. For a graphic the seven types cannot express,
   write JSX directly using the patterns in `references/tools.md` section 4.
4. Import and place video-only on V2 (or V3) at the planned time
   (`timeline.place {item, track:"V2", seconds, audio:false}`).

Keep one font, one accent colour, and text inside the safe area. Fewer, well-timed graphics beat many.

### 6. Check, export, verify

1. Render frames at every transition, punch-in, freeze and graphic, and read them.
2. Export: `file.exportMedia` with `format:"h264"`, `loudnessLufs:-14`, a bitrate near the source,
   `wait:true`. For 9:16, export the 1080x1920 sequence.
3. Verify the **exported file**, not the project: probe it, sample frames from it, measure its
   loudness profile.
4. Keep the project and passes so changes are cheap.

### 7. Report

Tell the user, briefly and concretely:
- where the file is, its length and format,
- what you changed and why (the opening, cuts, repairs, graphics, audio), with timestamps for the
  moments worth checking,
- what you could not verify: motion feel, music timing, voice quality after cleanup, whether a pause
  cut lands mid-thought. Ask them to watch those spots and tell you what to change.

## Things that need the user's OK first

- Downloading anything (the CLIs, Whisper models, music or SFX).
- Moving, renaming or overwriting their files; publishing or uploading anywhere.
- Big creative changes they did not ask for (reordering the story, removing a whole section): propose
  them, do not just do them.

## Shooting advice

When the user asks how to film (or the footage shows a fixable habit), give the short version from
playbook section 6: eyes on the top third, soft key light at 45 degrees, no mixed colour temperatures,
shutter at 1/(2 x fps), a mic 15-20 cm from the mouth, 30-60 s of room tone, b-roll shot at 7-12 s per
take, and lock exposure and focus on phones.
