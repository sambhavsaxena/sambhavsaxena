"""Word-level transcript of a WAV with faster-whisper, for when filmcraft-cli was built without Whisper.

Usage (ask the user first: ~100 MB of packages plus the ~145 MB whisper-base model):
    uv run --with faster-whisper --with numpy python transcribe.py audio.wav words.json

Writes {"language", "segments": [{start, end, text}], "words": [{text, start, end, p}]} in seconds.
Audio is passed as samples (not a path) because faster-whisper's PyAV loader breaks on newer PyAV.
"""
import json
import sys

import wave

import numpy as np
from faster_whisper import WhisperModel


def load_16k_mono(path):
    """48 kHz 16-bit WAV -> 16 kHz mono float32 (average channels, 3-tap box filter, decimate by 3)."""
    with wave.open(path) as w:
        rate, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, ch).mean(axis=1)
    step = rate // 16000
    x = x[: len(x) // step * step].reshape(-1, step).mean(axis=1)
    return x.astype(np.float32)

wav, out = sys.argv[1], sys.argv[2]
model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(load_16k_mono(wav), word_timestamps=True, vad_filter=False)
words, lines = [], []
for seg in segments:
    lines.append({"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip()})
    for w in seg.words or []:
        words.append({"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                      "p": round(w.probability, 2)})
json.dump({"language": info.language, "language_probability": round(info.language_probability, 2),
           "segments": lines, "words": words}, open(out, "w"), ensure_ascii=False, indent=1)
print(info.language, info.language_probability, len(lines), "segments", len(words), "words")
