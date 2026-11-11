# video-craft

A Claude skill that edits raw footage into a finished creator video and builds the motion graphics for
it. It drives two open-source, scriptable apps:

- [FilmCraft](https://github.com/storytold/filmcraft): non-linear editor (cuts, transitions, audio,
  captions, transcription, export).
- [EffectCraft](https://github.com/storytold/effectcraft): motion graphics compositor (lower thirds,
  kinetic captions, callouts, stat cards, charts, lists, title cards).

The editing decisions come from a researched playbook (`references/playbook.md`), ranked by how well
each rule is supported. The full report with every source is `references/evidence.md`. Hard
constraints (loudness, caption reading speed, safe areas, contrast, continuity) are applied as rules;
taste defaults (cut rate, punch-in scale, J-cut length) are stated and tunable.

## What it can do

- Find camera flips, dead air and shot changes from sampled frames and the audio loudness curve.
- Restructure for retention: a cold open that pays off the title, cuts of greetings and setup, beats
  joined by "but/therefore", re-hooks in long-form, and loop endings for Shorts.
- Tighten pauses without a machine-gun rhythm, alternate punch-ins on jump cuts, use J/L cuts,
  freeze-frame bridges, and motivated whips.
- Mix to -14 LUFS / -1 dBTP with dialogue cleanup, music ducking and fades on every audio edit.
- Render graphics from a JSON spec (`scripts/make_graphic.py`) and place them over the picture, or
  in place of it while the voice keeps playing.

## Requirements

- `filmcraft-cli` and `effectcraft-cli` on PATH (macOS: the signed CLI zips from each repo's
  releases). Optionally register them as MCP servers:
  `claude mcp add -s user filmcraft -- filmcraft-cli mcp` and
  `claude mcp add -s user effectcraft -- effectcraft-cli mcp`.
- Python 3; [uv](https://docs.astral.sh/uv/) for the scripts that need Pillow.
- Optional: a Whisper model for transcription (`transcript.downloadModel`, about 290 MB).

No FFmpeg is needed.

## Layout

```
video-craft/
├── SKILL.md                  workflow the agent follows
├── references/
│   ├── playbook.md           the rules, with numbers and confidence
│   ├── tools.md              FilmCraft / EffectCraft commands, JSX patterns, gotchas
│   └── evidence.md           research report with sources
├── scripts/
│   ├── sample_frames.sh      frames from a project at a fixed step
│   ├── contact_sheet.py      tile frames into readable sheets
│   ├── loudness_profile.py   loudness curve and pause list from a WAV
│   ├── plan_cuts.py          edit plan -> FilmCraft placement commands
│   └── make_graphic.py       JSON spec -> rendered motion graphic (7 types)
└── evals/                    test cases for `claude plugin eval`
```

## Install

Copy the `video-craft` folder into `~/.claude/skills/` (personal) or a project's `.claude/skills/`.

## Limits

The agent sees still frames and numbers, not motion or sound. It reports what it could not check
(motion feel, music timing, voice quality after cleanup), so a human pass over the export is still
part of the job.
