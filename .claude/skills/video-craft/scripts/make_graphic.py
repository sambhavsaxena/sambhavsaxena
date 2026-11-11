#!/usr/bin/env python3
"""Build a motion graphic in EffectCraft from a small JSON spec and render it ready for FilmCraft.

Usage:
    python3 make_graphic.py spec.json            # renders spec["out"], prints a JSON summary
    python3 make_graphic.py spec.json --jsx-only # just write the .jsx next to the output

Types (all times in seconds, relative to the graphic's own start):
  lower_third  {"name": "Ada Lovelace", "title": "Mathematician", "hold": null}
  title_card   {"title": "Chapter 2", "subtitle": "The engine", "duration": 3}
  stat         {"value": 72500, "prefix": "₹", "suffix": "", "decimals": 0, "label": "Avg. deal value", "duration": 4}
  bar_chart    {"title": "Leads by source", "bars": [{"label": "Ads", "value": 40}], "unit": "%", "times": [0.4, 1.1], "duration": 5}
  list         {"title": "Three rules", "items": ["Hook first", "Cut fluff"], "times": [0.5, 1.8], "duration": 5}
  captions     {"words": [{"text": "this", "start": 0.0, "end": 0.2}, ...], "max_words": 3, "max_chars": 18}
  callout      {"box": [x, y, w, h], "label": "Click here", "shape": "box"|"circle", "duration": 3}

Common keys: "type", "out" (.mov path), "width" (1920), "height" (1080), "fps" (30),
"style": {"font": "Inter-Bold", "font_light": "Inter-SemiBold", "accent": "#FDE047", "text": "#FFFFFF",
          "bg": "#0E1117", "plate": "#111318", "plate_opacity": 88}.

Overlays (lower_third, captions, callout) render ProRes 4444 with alpha: place them video-only on V2+.
Full-screen types (title_card, stat, bar_chart, list) render opaque: place video-only on V2 over the
voice so A1 keeps playing. Timing defaults follow the playbook: entrances ~10 frames ease-out, exits
~6 frames, text holds max(0.8 s, characters / 10) plus the entrance, captions <= 3 words.
"""
import json
import os
import subprocess
import sys

DEFAULT_STYLE = {
    "font": "Inter-Bold", "font_light": "Inter-SemiBold",
    "accent": "#FDE047", "text": "#FFFFFF", "muted": "#AEB4C0",
    "bg": "#0E1117", "plate": "#111318", "plate_opacity": 88,
}
OVERLAY_TYPES = {"lower_third", "captions", "callout"}

PRELUDE = r"""
var P = __PARAMS__;
var S = P.style, W = P.width, H = P.height, FPS = P.fps, F = 1 / FPS;
var IN = 10 * F, OUT = 6 * F;
function rgb(hex) { hex = hex.replace('#', ''); return [parseInt(hex.substr(0,2),16)/255, parseInt(hex.substr(2,2),16)/255, parseInt(hex.substr(4,2),16)/255]; }
function ease(prop) {
  var e = new KeyframeEase(0, 80);
  for (var k = 1; k <= prop.numKeys; k++) {
    try { prop.setTemporalEaseAtKey(k, [e], [e]); } catch (x) { try { prop.setTemporalEaseAtKey(k, [e,e,e], [e,e,e]); } catch (y) {} }
  }
}
function text(comp, str, size, font, color, just) {
  var l = comp.layers.addText(str);
  var td = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = td.value; d.fontSize = size; d.font = font; d.fillColor = rgb(color); d.applyFill = true;
  d.justification = just == "center" ? ParagraphJustification.CENTER_JUSTIFY
                  : just == "right" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY;
  td.setValue(d); return l;
}
function strokeText(l, width) {
  var td = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = td.value; d.strokeColor = [0,0,0]; d.strokeWidth = width; d.applyStroke = true; d.strokeOverFill = false; td.setValue(d);
}
function rect(comp, name, w, h, radius, color, opacity) {
  var l = comp.layers.addShape(); l.name = name;
  var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([w, h]); r.property("ADBE Vector Rect Roundness").setValue(radius);
  var f = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
  f.property("ADBE Vector Fill Color").setValue(rgb(color));
  l.property("ADBE Transform Group").property("ADBE Opacity").setValue(opacity);
  return { layer: l, size: r.property("ADBE Vector Rect Size") };
}
function tr(l, name) { return l.property("ADBE Transform Group").property(name); }
function width(l) { return l.sourceRectAtTime(0, false).width; }
function fadeInOut(l, t0, t1) {
  var o = tr(l, "ADBE Opacity");
  o.setValueAtTime(t0, 0); o.setValueAtTime(t0 + IN, 100); o.setValueAtTime(t1 - OUT, 100); o.setValueAtTime(t1, 0); ease(o);
}
function riseIn(l, t0, t1, dy) {
  var p = tr(l, "ADBE Position"), v = p.value;
  p.setValueAtTime(t0, [v[0], v[1] + dy]); p.setValueAtTime(t0 + IN, v); ease(p); fadeInOut(l, t0, t1);
}
function pop(l, t0, overshoot) {
  var s = tr(l, "ADBE Scale"), top = 100 + overshoot;
  s.setValueAtTime(t0, [85, 85]); s.setValueAtTime(t0 + 3 * F, [top, top]); s.setValueAtTime(t0 + 5 * F, [100, 100]); ease(s);
}
function background(comp) { comp.layers.addSolid(rgb(S.bg), "BG", W, H, 1); }
"""

LOWER_THIRD = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
var x0 = P.safe[0], yBase = H - P.safe[1] - 40;
var name = text(comp, P.name, Math.round(H * 0.055), S.font, S.text, "left");
var sub = P.title ? text(comp, P.title, Math.round(H * 0.032), S.font_light, S.muted, "left") : null;
var wMax = Math.max(width(name), sub ? width(sub) : 0) + 64, hPlate = sub ? H * 0.12 : H * 0.08;
var plate = rect(comp, "Plate", wMax, hPlate, 14, S.plate, S.plate_opacity);
plate.layer.moveToEnd();
var px = x0 + wMax / 2, py = yBase - hPlate / 2;
tr(plate.layer, "ADBE Position").setValue([px, py]);
var bar = rect(comp, "Accent", 8, hPlate, 4, S.accent, 100);
tr(bar.layer, "ADBE Position").setValue([x0 + 4, py]);
tr(name, "ADBE Position").setValue([x0 + 32, py + (sub ? -6 : H * 0.018)]);
if (sub) tr(sub, "ADBE Position").setValue([x0 + 32, py + H * 0.038]);
var sz = plate.size; sz.setValueAtTime(0, [0, hPlate]); sz.setValueAtTime(IN, [wMax, hPlate]); ease(sz);
var pp = tr(plate.layer, "ADBE Position"); pp.setValueAtTime(0, [x0, py]); pp.setValueAtTime(IN, [px, py]); ease(pp);
riseIn(name, 3 * F, dur, 18); if (sub) riseIn(sub, 5 * F, dur, 18);
fadeInOut(plate.layer, 0, dur); fadeInOut(bar.layer, 0, dur);
"""

TITLE_CARD = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
background(comp);
var t = text(comp, P.title, Math.round(H * 0.09), S.font, S.text, "center");
tr(t, "ADBE Position").setValue([W / 2, H / 2 + (P.subtitle ? -10 : H * 0.03)]);
riseIn(t, 2 * F, dur, 30);
if (P.subtitle) { var s = text(comp, P.subtitle, Math.round(H * 0.035), S.font_light, S.accent, "center");
  tr(s, "ADBE Position").setValue([W / 2, H / 2 + H * 0.07]); riseIn(s, 6 * F, dur, 20); }
"""

STAT = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
background(comp);
var n = text(comp, "0", Math.round(H * 0.2), S.font, S.accent, "center");
tr(n, "ADBE Position").setValue([W / 2, H / 2 + H * 0.04]);
var src = n.property("ADBE Text Properties").property("ADBE Text Document");
src.expression = "var t = Math.min(1, Math.max(0, (time - " + (4 * F) + ") / 1.0)); var e = 1 - Math.pow(1 - t, 3);" +
  "var v = (" + P.value + " * e).toFixed(" + P.decimals + "); var parts = v.split('.');" +
  "parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ','); '" + P.prefix + "' + parts.join('.') + '" + P.suffix + "'";
riseIn(n, 2 * F, dur, 30);
if (P.label) { var l = text(comp, P.label, Math.round(H * 0.04), S.font_light, S.muted, "center");
  tr(l, "ADBE Position").setValue([W / 2, H / 2 + H * 0.16]); riseIn(l, 10 * F, dur, 20); }
"""

BAR_CHART = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
background(comp);
var m = P.safe, top = m[1] + H * 0.06;
if (P.title) { var tt = text(comp, P.title, Math.round(H * 0.055), S.font, S.text, "left");
  tr(tt, "ADBE Position").setValue([m[0] + 40, top + H * 0.04]); riseIn(tt, 2 * F, dur, 20); }
var n = P.bars.length, maxV = 0; for (var i = 0; i < n; i++) maxV = Math.max(maxV, P.bars[i].value);
var labelW = W * 0.22, chartX = m[0] + 40 + labelW, chartW = W - chartX - m[0] - W * 0.12;
var rowH = (H - top - H * 0.12 - m[1]) / n, barH = Math.min(rowH * 0.6, H * 0.08);
for (var i = 0; i < n; i++) {
  var b = P.bars[i], t0 = P.times[i], y = top + H * 0.14 + rowH * i + rowH / 2, w = chartW * b.value / maxV;
  var lab = text(comp, b.label, Math.round(H * 0.035), S.font_light, S.muted, "right");
  tr(lab, "ADBE Position").setValue([chartX - 24, y + H * 0.012]); fadeInOut(lab, t0, dur);
  var r = rect(comp, "Bar" + i, w, barH, 6, i == P.highlight ? S.accent : S.text, i == P.highlight ? 100 : 85);
  var pos = tr(r.layer, "ADBE Position"), sz = r.size;
  sz.setValueAtTime(t0, [0, barH]); sz.setValueAtTime(t0 + 0.6, [w, barH]); ease(sz);
  pos.setValueAtTime(t0, [chartX, y]); pos.setValueAtTime(t0 + 0.6, [chartX + w / 2, y]); ease(pos);
  fadeInOut(r.layer, t0, dur);
  var val = text(comp, String(b.value) + P.unit, Math.round(H * 0.035), S.font, S.text, "left");
  var vp = tr(val, "ADBE Position"); vp.setValueAtTime(t0, [chartX + 16, y + H * 0.012]);
  vp.setValueAtTime(t0 + 0.6, [chartX + w + 16, y + H * 0.012]); ease(vp); fadeInOut(val, t0 + 0.2, dur);
}
"""

LIST = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
background(comp);
var m = P.safe, x = m[0] + W * 0.08, y = m[1] + H * 0.14;
if (P.title) { var tt = text(comp, P.title, Math.round(H * 0.06), S.font, S.text, "left");
  tr(tt, "ADBE Position").setValue([x, y]); riseIn(tt, 2 * F, dur, 20); y += H * 0.12; }
var step = Math.min(H * 0.11, (H - y - m[1]) / P.items.length);
for (var i = 0; i < P.items.length; i++) {
  var t0 = P.times[i], yi = y + step * i;
  var dot = rect(comp, "Dot" + i, 18, 18, 9, S.accent, 100); tr(dot.layer, "ADBE Position").setValue([x + 9, yi - H * 0.015]);
  pop(dot.layer, t0, 20); fadeInOut(dot.layer, t0, dur);
  var it = text(comp, P.items[i], Math.round(H * 0.045), S.font_light, S.text, "left");
  tr(it, "ADBE Position").setValue([x + 44, yi]); riseIn(it, t0 + 2 * F, dur, 16);
}
"""

CAPTIONS = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
var base = Math.round(Math.min(W, H) * (H > W ? 0.075 : 0.06)), y = P.caption_y, maxW = W - 2 * P.safe[0];
function setSize(l, s) { var td = l.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value; d.fontSize = s; d.strokeWidth = s * 0.09; td.setValue(d); }
for (var c = 0; c < P.chunks.length; c++) {
  var ch = P.chunks[c], layers = [], total = 0, size = base, gap = size * 0.34;
  for (var i = 0; i < ch.words.length; i++) {
    var w = text(comp, ch.words[i].text.toUpperCase(), size, S.font, S.text, "left"); strokeText(w, size * 0.09);
    layers.push(w); total += width(w) + (i ? gap : 0);
  }
  if (total > maxW) {                       // shrink the whole chunk to fit the safe width
    size = Math.floor(size * maxW / total); gap = size * 0.34; total = 0;
    for (var i = 0; i < layers.length; i++) { setSize(layers[i], size); total += width(layers[i]) + (i ? gap : 0); }
  }
  var x = W / 2 - total / 2;
  for (var i = 0; i < layers.length; i++) {
    var w = layers[i], wd = width(w), wi = ch.words[i];
    w.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([wd / 2, -size * 0.35]);
    tr(w, "ADBE Position").setValue([x + wd / 2, y]);
    w.inPoint = ch.start; w.outPoint = ch.end; pop(w, ch.start, 6);
    var hi = w.duplicate(); hi.inPoint = Math.max(wi.start, ch.start); hi.outPoint = Math.min(wi.end, ch.end);
    var td = hi.property("ADBE Text Properties").property("ADBE Text Document"), d = td.value; d.fillColor = rgb(S.accent); td.setValue(d);
    var hs = tr(hi, "ADBE Scale"); while (hs.numKeys) hs.removeKey(1); hs.setValue([100, 100]);   // colour only: a scaled copy ghosts over the base word
    x += wd + gap;
  }
}
"""

CALLOUT = r"""
var dur = P.duration, comp = app.project.items.addComp(P.name_comp, W, H, 1, dur, FPS);
var b = P.box, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
var l = comp.layers.addShape(); l.name = "Mark";
var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
var sh = P.shape == "circle" ? g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse")
                             : g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
sh.property(P.shape == "circle" ? "ADBE Vector Ellipse Size" : "ADBE Vector Rect Size").setValue([b[2] + 24, b[3] + 24]);
if (P.shape != "circle") sh.property("ADBE Vector Rect Roundness").setValue(12);
var st = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
st.property("ADBE Vector Stroke Color").setValue(rgb(S.accent)); st.property("ADBE Vector Stroke Width").setValue(Math.max(6, H * 0.007));
var trim = g.property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
trim.setValueAtTime(0, 0); trim.setValueAtTime(12 * F, 100); ease(trim);
tr(l, "ADBE Position").setValue([cx, cy]); fadeInOut(l, 0, dur);
if (P.label) {
  var t = text(comp, P.label, Math.round(H * 0.035), S.font, "#111318", "left");
  var tw = width(t) + 40, th = H * 0.06, below = b[1] + b[3] + 24 + th < H - P.safe[1];
  var ly = below ? b[1] + b[3] + 28 + th / 2 : b[1] - 28 - th / 2;
  var lx = Math.min(Math.max(b[0] + tw / 2, P.safe[0] + tw / 2), W - P.safe[0] - tw / 2);
  var pl = rect(comp, "LabelPlate", tw, th, th / 2, S.accent, 100); pl.layer.moveToEnd();
  tr(pl.layer, "ADBE Position").setValue([lx, ly]); tr(t, "ADBE Position").setValue([lx - tw / 2 + 20, ly + H * 0.012]);
  pop(pl.layer, 8 * F, 8); fadeInOut(pl.layer, 8 * F, dur); fadeInOut(t, 9 * F, dur);
}
"""

TEMPLATES = {"lower_third": LOWER_THIRD, "title_card": TITLE_CARD, "stat": STAT,
             "bar_chart": BAR_CHART, "list": LIST, "captions": CAPTIONS, "callout": CALLOUT}


def hold_for(*texts, entrance=10 / 30):
    """Reading time: max(0.8 s, characters / 10) + entrance (read-twice at Netflix's 20 cps)."""
    chars = sum(len(t or "") for t in texts)
    return max(0.8, chars / 10) + entrance


def safe_margins(w, h):
    if h > w:   # 9:16 organic union box x 60-960, y 210-1600 (scaled from 1080x1920)
        return [round(w * 60 / 1080), round(h * 320 / 1920)]
    return [round(w * 0.05), round(h * 0.05)]   # 16:9 title safe 90%


def chunk_words(words, max_words, max_chars, gap_break=0.3):
    chunks, cur = [], []
    for w in words:
        too_long = len(" ".join(x["text"] for x in cur + [w])) > max_chars
        paused = cur and w["start"] - cur[-1]["end"] > gap_break
        if cur and (len(cur) >= max_words or too_long or paused):
            chunks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    out = []
    for i, ch in enumerate(chunks):
        next_start = chunks[i + 1][0]["start"] if i + 1 < len(chunks) else None
        end = max(ch[-1]["end"] + 0.15, ch[0]["start"] + 20 / 30)   # Netflix 20-frame minimum...
        end = min(end, ch[-1]["end"] + 0.6)
        if next_start is not None:
            end = min(end, next_start)                                 # ...but never overlap the next chunk
        out.append({"start": ch[0]["start"], "end": end, "words": ch})
    return out


def prepare(spec):
    p = {"width": 1920, "height": 1080, "fps": 30, **spec}
    p["style"] = {**DEFAULT_STYLE, **spec.get("style", {})}
    p["safe"] = safe_margins(p["width"], p["height"])
    p["name_comp"] = os.path.splitext(os.path.basename(p["out"]))[0]
    kind = p["type"]
    if kind == "lower_third":
        p.setdefault("title", "")
        p["duration"] = p.get("duration") or round(hold_for(p["name"], p["title"]) + 1.5, 2)
    elif kind == "title_card":
        p.setdefault("subtitle", "")
        p["duration"] = p.get("duration") or round(hold_for(p["title"], p["subtitle"]) + 0.6, 2)
    elif kind == "stat":
        p = {"prefix": "", "suffix": "", "decimals": 0, "label": "", **p}
        p["duration"] = p.get("duration") or round(1.4 + hold_for(p["label"]), 2)
    elif kind in ("bar_chart", "list"):
        n = len(p["bars"] if kind == "bar_chart" else p["items"])
        p.setdefault("title", "")
        p.setdefault("unit", "")
        p.setdefault("highlight", -1)
        p["times"] = p.get("times") or [0.4 + 0.5 * i for i in range(n)]
        p["duration"] = p.get("duration") or round(p["times"][-1] + 2.5, 2)
    elif kind == "captions":
        p["chunks"] = chunk_words(p["words"], p.get("max_words", 3), p.get("max_chars", 18))
        p["duration"] = p.get("duration") or round(p["chunks"][-1]["end"] + 0.1, 2)
        p["caption_y"] = p.get("caption_y") or (p["height"] * 0.62 if p["height"] > p["width"] else p["height"] * 0.8)
    elif kind == "callout":
        p.setdefault("shape", "box")
        p.setdefault("label", "")
        p["duration"] = p.get("duration") or round(hold_for(p["label"]) + 1.0, 2)
    else:
        raise SystemExit(f"unknown type {kind!r}; expected one of {sorted(TEMPLATES)}")
    return p


def build_jsx(p):
    return PRELUDE.replace("__PARAMS__", json.dumps(p, ensure_ascii=False)) + TEMPLATES[p["type"]] + '\nwriteLn("ok");\n'


def render(p, jsx_path):
    out = os.path.abspath(p["out"])
    project = os.path.splitext(out)[0] + ".ecproj"
    run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
    built = run("effectcraft-cli", "--empty", "--save-as", project, "script", jsx_path)
    if "ok" not in built.stdout.split():
        raise SystemExit(f"JSX did not finish:\n{built.stdout}\n{built.stderr}")
    channels = "rgba" if p["type"] in OVERLAY_TYPES else "rgb"
    run("effectcraft-cli", "--project", project, "render", "--comp", p["name_comp"], "--out", out,
        "--format", "prores", "--prores", "4444", "--channels", channels, "--audio", "off")
    previews = []
    for frac in (0.15, 0.5, 0.85):
        png = f"{os.path.splitext(out)[0]}_preview_{int(frac * 100)}.png"
        run("effectcraft-cli", "--project", project, "render-frame", "--comp", p["name_comp"],
            "--time", f"{p['duration'] * frac:.2f}", "--scale", "0.3", "--out", png)
        previews.append(png)
    return {"out": out, "project": project, "duration": p["duration"], "alpha": channels == "rgba",
            "previews": previews}


def main():
    spec = json.load(open(sys.argv[1]))
    p = prepare(spec)
    os.makedirs(os.path.dirname(os.path.abspath(p["out"])), exist_ok=True)
    jsx_path = os.path.splitext(os.path.abspath(p["out"]))[0] + ".jsx"
    open(jsx_path, "w").write(build_jsx(p))
    if "--jsx-only" in sys.argv:
        print(json.dumps({"jsx": jsx_path}))
        return
    print(json.dumps(render(p, jsx_path), indent=1))


if __name__ == "__main__":
    main()
