#!/usr/bin/env python3
"""transcribe.py <audio> <out.json> [--local] [--language en]  |  --selftest
Writes [{word,start,end(,confidence)}] seconds. Default: OpenAI whisper-1; --local: faster-whisper base."""
import argparse, json, os, sys


def shape(words):
    """Round + strip raw word dicts ({word,start,end[,probability]}); drop empty tokens."""
    out = []
    for w in words:
        t = w["word"].strip()
        if not t:
            continue
        o = {"word": t, "start": round(w["start"], 3), "end": round(w["end"], 3)}
        if w.get("probability") is not None:
            o["confidence"] = round(w["probability"], 3)
        out.append(o)
    return out


def openai(audio, language):
    import requests
    with open(audio, "rb") as f:
        r = requests.post("https://api.openai.com/v1/audio/transcriptions", timeout=600,
                          headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                          files={"file": (os.path.basename(audio), f)},
                          data={"model": "whisper-1", "response_format": "verbose_json",
                                "timestamp_granularities[]": "word", "language": language})
    if r.status_code != 200:  # no retry on auth/quota
        sys.exit(f"Whisper failed {r.status_code}: {r.text[:300]}")
    return shape(r.json()["words"])


def local(audio, language):
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel("base", compute_type="int8").transcribe(audio, word_timestamps=True, language=language)
    return shape([{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                  for s in segs for w in s.words])


def selftest():
    r = shape([{"word": " Hello", "start": 0.12345, "end": 0.5}, {"word": " ", "start": 0.5, "end": 0.6},
               {"word": "world.", "start": 0.5, "end": 1.0004, "probability": 0.98765}])
    assert r == [{"word": "Hello", "start": 0.123, "end": 0.5},
                 {"word": "world.", "start": 0.5, "end": 1.0, "confidence": 0.988}], r
    print("selftest ok")


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(); sys.exit()
    p = argparse.ArgumentParser()
    p.add_argument("audio"); p.add_argument("out")
    p.add_argument("--local", action="store_true"); p.add_argument("--language", default="en")
    a = p.parse_args()
    words = (local if a.local else openai)(a.audio, a.language)
    with open(a.out, "w") as f:
        json.dump(words, f, indent=1)
    print(f"Wrote {a.out}: {len(words)} words")
