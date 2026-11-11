# FilmCraft + EffectCraft: how to drive them

Written against filmcraft-cli 0.19.0 and effectcraft-cli 0.23.1. Every command id and parameter below
comes from the tools' own command catalogs; the ones marked "verified" were also run end to end on a real
edit. Both apps change fast, so when a command fails, run `filmcraft-cli describe <id>` or
`effectcraft-cli commands --filter <text>` before guessing.

## Contents
1. Install and connect
2. Time units and ids
3. FilmCraft: the edit
4. EffectCraft: motion graphics
5. Putting graphics into the edit
6. Looking at your work (you cannot watch video)
7. Gotchas found the hard way

---

## 1. Install and connect

Both tools ship a CLI that is also an MCP server. No FFmpeg is needed.

- macOS: the signed `filmcraft-cli-<ver>-macos-universal.zip` and `effectcraft-cli-<ver>-macos-universal.zip`
  release assets on github.com/storytold/filmcraft and github.com/storytold/effectcraft. Verify against
  `SHA256SUMS.txt`, unzip, put the binaries on PATH (for example `~/.local/bin`).
- Linux deb/rpm install `/usr/bin/filmcraft-cli`; Windows MSI puts it in
  `%LOCALAPPDATA%\Programs\ArtCraft\FilmCraft\`.
- Register: `claude mcp add -s user filmcraft -- filmcraft-cli mcp` and
  `claude mcp add -s user effectcraft -- effectcraft-cli mcp`. MCP servers load only in a new session,
  so inside the current session drive the CLIs directly. The CLI is the more reliable path for long
  scripted edits anyway: one JSONL file is a reviewable, re-runnable edit decision list.

Ask the user before downloading anything (CLIs, speech models).

## 2. Time units and ids

- FilmCraft time: 254016000000 ticks per second. Most commands also take `seconds`, `frame` or `timecode`.
  Snap every cut to the frame grid (`round(t * fps) / fps`) so nothing lands between frames.
- EffectCraft time: seconds.
- Ids come back from commands (`{"clips":[16,17]}` = video clip, linked audio clip). Never hard-code ids;
  run a pass, then `inspect sequence` and read them.

## 3. FilmCraft: the edit

### Project and sequence
```bash
filmcraft-cli --save-as edit.fcproj import /abs/path/clip.mp4           # item id 1
filmcraft-cli probe /abs/path/clip.mp4 --compact                        # fps, size, duration, codec
filmcraft-cli --project edit.fcproj --save run pass1.jsonl --compact    # JSONL: {"id":..,"params":{..}} per line
filmcraft-cli --project edit.fcproj inspect sequence --compact > seq.json
```
`--save` writes back; leave it off for a dry run (great for checking a long script first).
`--keep-going` reports failing lines and continues.

### Building the cut (back to back from one source)
```json
{"id":"file.newSequence","params":{"name":"Edit","width":1920,"height":1080,"fps":30,"video":3,"audio":3}}
{"id":"timeline.place","params":{"item":1,"track":"V1","audioTrack":"A1","seconds":0.0,"insert":false,
  "sourceIn":{"seconds":1.4},"duration":{"seconds":9.3}}}
```
Each place returns a linked video+audio pair. Place video only with `"audio":false`, sound only with
`"track":"A1"`. For 9:16 make the sequence 1080x1920.

`seq.json` layout: `sequence.video[n].items[]` and `sequence.audio[n].items[]`, each item with
`clip, start, end, sourceIn, sourceOut` (ticks), `durationFrames`, `effects`.

### Useful commands
| Need | Command |
|---|---|
| Find hard cuts / camera flips (verified) | `clip.sceneEditDetection {clips:[id], applyCuts:false, generateMarkers:true, wait:true}` (select the clip first with `timeline.select`) |
| Word-level transcript | `transcript.downloadModel {model:"whisper-base"}` (~290 MB, ask first), then `transcript.generate {items:[1]}` or `sequence.transcribe {}`; read with `transcript.inspect` |
| Cut text out by words | `transcript.extract` / `transcript.lift {from, to}` |
| Punch-in / reframe (verified) | `effects.setParam {clip, effect:"motion", param:"scale"\|"position", value}` |
| Animate (verified) | same with `time` (sequence ticks) and `keyframe:true`; `effects.setInterpolation` for ease |
| Freeze frame (verified) | `clip.frameHoldOptions {clips:[id], enabled:true, holdOn:"in"}` |
| Speed | `clip.speedDuration {clips, speed, maintainPitch:true}` |
| Video transition (verified) | `sequence.applyVideoTransition {clip, effect, edge:"out", align:"center", frames, params}` |
| Audio crossfade (verified) | `sequence.applyAudioTransition {clip, effect:"constant_power", edge:"out", align:"center", frames:3}` |
| Dialogue cleanup (verified) | `essentialSound.setType {clips, type:"dialogue"}` then `essentialSound.applyPreset {clips, preset:"Clean Up Noisy Dialogue", type:"dialogue"}` |
| Music ducking | music clips: `essentialSound.setType type:"music"` + preset `"Duck Under Dialogue"` |
| Clip gain | `clip.audioGain {clips, mode:"set"\|"normalizeMax", db}` |
| Captions | `captions.newTrack`, `captions.add {text, seconds, durationSeconds}`, `captions.setStyle`, `captions.import {path:".srt"}`; burn in at export with `burnCaptions:true` |
| Simple titles in-editor | `graphics.newText`, `graphics.newRectangle` (fine for plain text; use EffectCraft for anything animated) |
| Color | `lumetri` effect params via `effects.setParam`; `lumetri.applyMatch` to match shots |
| Export (verified) | `file.exportMedia {path, format:"h264", bitrateKbps, loudnessLufs:-14, hardwareEncoding:"auto", wait:true}` |

Transition ids (from `effects.list kind=VideoTransition`): `cross_dissolve`, `dip_to_black`,
`dip_to_white`, `film_dissolve`, `morph_cut`, `whip`, `push`, `slide`, `cross_zoom`, `zoom_blur`,
`directional_blur_transition`, `glitch`, `light_leak`, `flash`, `luma_fade`, `spin_3d`, and many more.
A transition needs handles (source frames beyond the cut). With `align:"center"` it eats half its length
from each side; on a single continuous source those handles always exist.

## 4. EffectCraft: motion graphics

Two ways in. Prefer the JSX script for anything with more than a couple of keyframes: it is the After
Effects object model, so keyframes, easing and expressions read naturally.

```bash
effectcraft-cli --empty --save-as gfx.ecproj script build.jsx      # run JSX, save project
effectcraft-cli --project gfx.ecproj render-frame --comp Name --time 1.0 --scale 0.3 --transparent --out f.png
effectcraft-cli --project gfx.ecproj render --comp Name --out gfx.mov --format prores --prores 4444 --channels rgba --audio off
```

Verified JSX patterns:
```js
var comp = app.project.items.addComp("LowerThird", 1920, 1080, 1, 4, 30);   // name, w, h, par, seconds, fps

// shape (rounded bar)
var bar = comp.layers.addShape();
var grp = bar.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
var rect = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([620, 120]);
rect.property("ADBE Vector Rect Roundness").setValue(16);
grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill")
   .property("ADBE Vector Fill Color").setValue([0.09, 0.09, 0.11]);

// text: set justification, or point text is centred on its position
var t = comp.layers.addText("Name Surname");
var td = t.property("ADBE Text Properties").property("ADBE Text Document");
var d = td.value; d.fontSize = 56; d.fillColor = [1,1,1]; d.applyFill = true;
d.justification = ParagraphJustification.LEFT_JUSTIFY; td.setValue(d);

// keyframes + easing (ease-out entrance: zero speed on arrival, high influence)
var p = t.property("ADBE Transform Group").property("ADBE Position");
p.setValueAtTime(0.0, [-400, 915]); p.setValueAtTime(0.4, [200, 915]);
var e = new KeyframeEase(0, 75); p.setTemporalEaseAtKey(2, [e], [e]);

// expressions work
t.property("ADBE Transform Group").property("ADBE Opacity").expression = "linear(time,0,0.3,0,100)";
writeLn("done");
```

Command-side helpers (`effectcraft-cli exec <id> --params '<json>'`):
- `text.presets` lists built-in text animations: `typewriter`, `fadeUpCharacters`, `bounceInWords`,
  `trackingIn`, `scramble`, `blurIn`, `jitter`, `dropInLines`. Apply with `anim.applyPreset`.
- `text.fonts {query}` lists installed fonts. Pick one that exists or the renderer substitutes.
- `layer.newShape`, `layer.newText`, `layer.newSolid`, `layer.newNull`, `effect.apply {effect, layers}`,
  `layer.style.add {style:"dropShadow"}`, `keys.easyEase`, `track.motion` / `track.analyze` (attach a
  callout to something moving), `file.importLottie`, `file.exportLottie`.
- `file.import {paths}` brings footage, a screenshot or a chart image in to animate.

## 5. Putting graphics into the edit

- **Overlay** (lower third, callout, kinetic caption): render ProRes 4444 with `--channels rgba`, import
  into FilmCraft, place on V2 or V3 with `"audio":false`. FilmCraft reads the alpha
  (`probe` shows `"has_alpha":true`) and composites it over V1. Verified.
- **Full-screen infographic while the voice continues**: render the graphic opaque (no alpha needed),
  place it video-only on V2 over the stretch you want to cover. A1 keeps playing underneath, so the
  narration never breaks. Cut V2 on a word or a beat, not mid-word, and keep it at least as long as the
  reading time for its text.
- Keep graphics the same frame size and fps as the sequence so nothing rescales.
- Re-rendering a graphic to the same path and re-importing with `file.import {paths, replace:true}`
  updates it in place.

## 6. Looking at your work (you cannot watch video)

You see still frames and numbers, not motion or sound. Compensate deliberately:
- **Contact sheets**: `filmcraft-cli render --seconds S --out f.png --scale 0.2` is ~100 ms per frame.
  Render one frame per second of the source, tile them (scripts/contact_sheet.py), and read the sheets
  to find shot changes, camera flips, dead air, bad framing.
- **Zoom in on a moment**: frames every 0.2 s across a suspect region (scripts/sample_frames.sh).
- **Audio**: export WAV (`export out.wav --format wav`) and compute a 50 ms RMS loudness curve
  (scripts/loudness_profile.py). Runs below about -40 dBFS for 0.5 s or more are pauses. A transcript
  is better still: it tells you what is said, not just that something is said.
- **After the edit**: render frames at every transition and effect, read them, then export and re-check
  the exported file (probe it, sample frames, measure loudness) rather than trusting the project.
- Always tell the user what you could not check (motion feel, music timing, voice quality).

## 7. Gotchas found the hard way

- `clip.sceneEditDetection` says "select a video clip in the timeline": send `timeline.select` first,
  even when you pass `clips`.
- Point text in EffectCraft is centred on its position unless you set `justification`.
- Keyframe `time` in `effects.setParam` is sequence time, not clip-relative.
- `file.newSequenceFromClip` uses the clip's settings; `file.newSequence` defaults to 23.976 fps unless
  you pass `fps`.
- MCP servers added with `claude mcp add` are not usable until a new session starts.
- In zsh, `set -- $var` does not word-split; write loops as bash scripts.
