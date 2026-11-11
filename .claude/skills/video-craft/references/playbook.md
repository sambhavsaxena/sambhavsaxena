# Editing playbook: the rules, with numbers

Distilled from `evidence.md` (the full research report with every source). Confidence: **H** = published
standard, official platform doc, or 3+ independent credible sources; **M** = two sources or one strong
primary source; **L** = single vendor or anecdote; **D** = derived by arithmetic from cited figures.

Two kinds of rule live here. **Hard constraints** are physics and perception: apply them without
negotiation. **Taste defaults** are starting points: apply them, then let the user's reaction and the
video's own retention graph overrule them.

## Contents
1. Hard constraints
2. Story and hook
3. Cutting and pacing
4. Sound
5. Graphics (overlay and full-screen)
6. Picture: framing, color, reframing
7. Platform presets
8. Repair patterns for common footage problems
9. Myths to never cite

---

## 1. Hard constraints

| Rule | Number | Conf |
|---|---|---|
| Delivery loudness for YouTube / social | -14 LUFS integrated, true peak <= -1 dBTP | H |
| Other targets | podcast -16 LUFS; EBU R128 -23 LUFS / -1 dBTP; ATSC A/85 -24 LKFS / -2 dBTP | H |
| Fade every audio edit, never hard-cut sound | 2-3 frames on dialogue (5-50 ms), ~10 frames on SFX | M |
| On-screen text reading speed | <= 20 characters/second (17 for children); speech 160-180 wpm | H |
| Text event minimum and gaps | >= 20 frames on screen; gap exactly 2 frames or >= 0.5 s | H |
| Caption lines | <= 42 characters, <= 2 lines, bottom-heavy breaks, never split article+noun or first+last name | H |
| 16:9 safe areas | text inside 90% (title safe), action inside 93% | H |
| 9:16 critical-content box (1080x1920) | x 60-960, y 210-1600 for organic; ads: top 269, bottom 672, sides 65 px | M direction, L pixels |
| Text contrast | >= 4.5:1 (3:1 for large type), via stroke, shadow or plate over video | H |
| Continuity | stay on one side of the 180-degree axis; same-subject cuts change angle >= 30 degrees or scale visibly, else it is a jump cut | H |
| Snap cuts to the frame grid | round(t * fps) / fps | H |
| Promise check | the footage the title/thumbnail promises appears in frame 1 (short) or within 5-15 s, never later than 30 s (long) | H |

## 2. Story and hook

The best-supported rule in creator video: **the opening visibly pays off the title and thumbnail.**
YouTube's "Intro" metric is retention at 30 s and is tied to that match; MrBeast's memo shows 21M of
60M viewers leaving in minute one; Galloway, Blackman and the Colin and Samir hosts agree.

| Rule | Number | Conf |
|---|---|---|
| Cold open: move the strongest moment (result, reveal, best line) to the start | 0 s of pre-hook material: no logo, "hey guys", or setup first | H |
| Long-form intro beats | confirm the click (~0 s) -> context (<= 7 s) -> new hook/twist (<= 30 s) | M |
| Face on screen and say "you" early | person in frame by ~2 s; "you" within 5 s | M (ad data) |
| Shorts structure | visual hook -> foreshadow (<= 3 s) -> story -> loop back to frame 1; ~34 s is a good target | M |
| Readable on mute, 5th-grade language; explain jargon at first use | | M |
| Beats join with "but" or "therefore", never "and then"; cut or reorder "and then" beats | every joint | M |
| Every segment is a mini video: its own hook, stakes, resolution | | M |
| Long-form re-hooks | strongest secondary moment at ~22% and ~44% of runtime (MrBeast ~3:00 and ~6:00 of 13.6 min) | M, D scaling |
| Ending | hard cut soon after the final payoff; delete "that's it for today", outro montages | M |
| CTAs | none before the first payoff | L-M |
| Sponsor/ad reads | woven into the story, not a standalone block | M |
| Shorts loops | the last frame/line flows into frame 1; replays count as views since Mar 2025 | H mechanism |

Hook types ranked (no platform A/B exists, so Low-Medium): result-first / cold open > face + "you" >
stakes or curiosity line > bold or contrarian claim > question.

## 3. Cutting and pacing

**Information density, not cut density, sets the pace.** MrBeast publicly slowed his edits in 2024
("let scenes breathe"); his sampled cut rate fell from 38 to 23 per minute. Joos, Blackman and
Galloway all say the same: pace is the rate of new problems and new information. So every cut, zoom,
SFX or graphic must carry something new. A cut on a timer is noise.

| Rule | Number | Conf |
|---|---|---|
| Choose cut points by priority | emotion > story > rhythm > eye-trace > 2D plane > 3D space (Murch 51/23/10/7/5/4) | H |
| Long-form reference cut rate | ~23 cuts/min is a ceiling for entertainment, not a target; talk/tutorial much lower | L-M |
| Shorts | a meaningful visual or information change every ~2-4 s (default, not law) | L |
| Silence removal | keep ~0.15-0.2 s of room on each side of speech; no gap shorter than 150-200 ms | M |
| Keep pauses that carry meaning (after a punchline, before a reveal, a held look) | | M |
| Jump-cut punch-in | alternate 100% and 110-115% at sentence starts; not on consecutive cuts; 130% for one emphasis line | M |
| Cover remaining jump cuts | b-roll that shows what is being said, a screen recording, a graphic, or cut on a blink/nod | M |
| J-cut (audio leads picture) | 6-12 frames at 30 fps for dialogue; 1-3 s to bridge scenes with ambient sound | L, D |
| L-cut (audio trails picture) | carry the speaker's voice over the b-roll or the next shot | H definition |
| Hold a big beat | after a run of fast cuts, hold 2-4x the local average shot length | M direction, D number |
| Transitions | default to straight cuts; stylized transitions (whip, zoom, glitch) only when motivated, e.g. a camera move, a location jump, a camera flip | M |
| B-roll | 2.5-4 s per insert in the edit; always relevant to the spoken line | L |

## 4. Sound

| Rule | Number | Conf |
|---|---|---|
| Loudness at export | -14 LUFS / -1 dBTP (FilmCraft: `loudnessLufs: -14`) | H |
| Duck music under voice | 12-20 dB (start at -15 to -18 dB) | M |
| Room tone under every gap, so cuts never drop to digital silence | continuous bed | M |
| Whoosh on a transition | starts before the cut, peaks on the first frame of the new shot, tail trimmed | L |
| Dialogue cleanup | noise reduction on, then EQ; check it does not sound processed (you cannot hear it: say so) | M |
| Music | cut on a beat when you can see the beat in the waveform; otherwise crossfade under speech | L |
| Capture advice for the creator | lav 15-20 cm from the mouth; 30-60 s of room tone; peaks -12 to -6 dBFS | H/M/M |

## 5. Graphics (overlay and full-screen)

The full-screen graphic is the one interrupt that *always* carries new information, so it fits what
retention experts say matters. The narrator's voice sets the timing (Kurzgesagt: the voiceover "provides
the timing for the animation team").

| Rule | Number | Conf |
|---|---|---|
| Voice stays continuous on A1; graphic sits video-only on V2 | | H principle |
| Graphic in and out points land on narration sentence boundaries | | H |
| Each element appears as the voice names it | 0-2 frames before the word | D |
| Hold time | max(0.8 s, characters / 10) + entrance; short labels 1.5-3 s, lower thirds 3-6 s | M |
| Text stops moving before the reading time starts | | M |
| Entrances decelerate, exits accelerate and are shorter | entrance 250-400 ms (8-12 frames at 30 fps), exit 150-250 ms | H curves, D frames |
| Easing curves | Material: decelerate cubic-bezier(0.05, 0.7, 0.1, 1); accelerate (0.3, 0, 0.8, 0.15) | H |
| Word pop (kinetic captions) | 4-6 frames with 5-10% overshoot | D |
| Kinetic captions | 2-4 words, heavy all-caps sans, active word in yellow (#FDE047) or green | L (vendor convention) |
| Japanese telop style | ~16 characters/line, outlined gothic, <= 5-6 caption styles, SFX on emphasis | M |
| Overlay delivery | ProRes 4444 with alpha, alpha interpretation matched in both apps | M |
| Consistency | one font family, one accent colour, a plate behind text over busy video | M |

When to use which (D, synthesized):
- **Lower third**: first time a person or place appears; hold 3-6 s.
- **Callout / highlight box**: pointing at one thing in a screen recording or a product.
- **Full-screen stat**: a single number the narration leans on ("72,500 rupees average deal").
- **Full-screen bar chart / list**: comparisons, rankings, steps; reveal one bar or item per clause.
- **Title card / chapter card**: segment boundaries in long-form; keep them short (<= 2 s) and never
  as the opening shot.
- **Kinetic captions**: short-form and anywhere viewers watch on mute; skip on calm long-form unless asked.
- Replace the picture with a graphic when the talking head adds nothing for that stretch: a number,
  a list, a comparison, a place, a document. Keep the face when emotion or credibility is the point.

## 6. Picture: framing, color, reframing

| Rule | Number | Conf |
|---|---|---|
| Eyes on the top-third line, modest headroom, look room on the side the subject faces | | H |
| Shutter | 1/(2 x fps): 24->1/50, 30->1/60, 60->1/120; 25/50 fps at 1/50 in 50 Hz countries | H |
| Key light | soft, ~45 degrees off-axis, slightly above eye level; never mix daylight and tungsten on a face | H |
| Skin exposure (Rec.709) | light skin ~55-70 IRE, darker lower; convert log before judging | M |
| Color order | log->709 -> black/white points -> white balance -> skin -> match to hero shot -> look | H |
| Punch-in budget | 4K source in 1080 timeline: up to 2.0x total; 1080 in 1080: ~1.1-1.2x before softness shows | M |
| Stacked crops multiply | 10% stabilization crop x 1.5 punch-in = 1.65x | D |
| 9:16 from 16:9 | 3840x2160 gives a ~1215x2160 crop: little room left to punch in | D |
| Cannot fix, only hide | autofocus hunting, clipped highlights, mixed colour on a face, strobing from fast shutter | M |

## 7. Platform presets

| | YouTube long-form | Shorts / Reels / TikTok |
|---|---|---|
| Frame | 1920x1080 (or 4K) | 1080x1920, native 9:16 (never 4:5 or 1:1 uploads) |
| Opening | promise visible within 5-15 s, new hook by 30 s | promise in frame 1, foreshadow <= 3 s |
| Length | as long as the story holds; re-hooks at ~22% and ~44% | ~34 s is a good target; trim the tail |
| Pace | change when there is new information; ~23 cuts/min is a ceiling | meaningful change every ~2-4 s |
| Captions | optional, burned-in for mute-heavy audiences | burned-in kinetic captions, inside y 210-1600 |
| Ending | hard cut after payoff | loop to frame 1 |
| Loudness | -14 LUFS / -1 dBTP | same |
| Reposting | n/a | re-cut per platform; no watermarks (Instagram demotes reposts) |

## 8. Repair patterns for common footage problems

- **Camera flip / turning the phone around mid-take**: find the blur run (frames sampled every 0.2 s).
  If the speaker is silent during it, cut it out at the pause and join with a short whip (6-8 frames)
  in the direction of the turn. If they keep talking, keep the audio continuous and cover the picture:
  freeze the last clean frame with a slow 100->108% push-in, or cut away to b-roll or a graphic, then
  whip into the new angle. Never ripple out speech.
- **Shaky setup at the start** (adjusting the phone, ceiling shots): drop it; start on the first
  usable frame of speech or, better, on the cold-open moment.
- **Dead air and false starts**: tighten pauses (section 3); remove repeated takes, keeping the last
  clean one.
- **Long talking head with nothing to see**: alternate punch-ins at sentence starts, then replace
  information-heavy stretches with full-screen graphics or callouts over screen recordings.
- **Screen recording filmed off a monitor**: punch in to the region being discussed, add a callout box,
  short dissolves (3-4 frames) on internal cuts so handheld jumps feel smooth.
- **Wobbly handheld**: stabilize before punching in; remember stacked crops.
- **Noisy room**: dialogue cleanup preset; duck or remove music under it rather than raising music.

## 9. Myths to never cite

- "8-second attention span / shorter than a goldfish": traces to an ad report, no peer review.
- "Viewers decide in 0.9 seconds": unsourced.
- "Aim for 70% retention": not universal; 100M+ view videos often average ~40%; Shorts need far more.
- "Cut every 2-3 seconds for 82% retention": no method shown.
- "MrBeast's views rose because he cut less": correlation only.
- "Mark Rober always shows the ending first" / "Jenga storytelling": not his words.
- Official pixel safe zones for organic posts: they do not exist; published ones are ad specs.
