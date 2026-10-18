#!/usr/bin/env python3
"""Voiceover + word timings for the video studio.

  voiceover.py --text script.txt --out studio/public [--voice ID] [--provider auto|elevenlabs|openai]
  voiceover.py --audio existing.mp3 --text script.txt --out studio/public   # align only
  add --local to align with faster-whisper on this machine (no API credits needed)
  voiceover.py --selftest

Writes <out>/voice.mp3, <out>/words.json ([{word,start,end}] seconds) and <out>/voice.json (meta).
Whisper is the single timing source for every provider, so captions behave the same whatever voiced them.
"""
import argparse, difflib, json, os, re, shutil, sys
import requests

EL_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
OA_TTS = "https://api.openai.com/v1/audio/speech"
OA_STT = "https://api.openai.com/v1/audio/transcriptions"


def norm(text):
    return re.findall(r"[a-z0-9']+", text.lower())


def match_ratio(script, words):
    """How closely the transcript matches the script. Below ~0.9 usually means a mispronounced or skipped line."""
    return round(difflib.SequenceMatcher(None, norm(script), norm(" ".join(w["word"] for w in words))).ratio(), 3)


def pick_provider(choice):
    if choice != "auto":
        return choice
    # A key ID (no sk_ prefix) authenticates nothing, so fall through to OpenAI instead of failing late.
    return "elevenlabs" if os.environ.get("ELEVENLABS_API_KEY", "").startswith("sk_") else "openai"


def tts(provider, text, voice, dest):
    if provider == "elevenlabs":
        if not voice:
            sys.exit("ElevenLabs needs --voice <voice_id> (list voices in the ElevenLabs app or MCP).")
        r = requests.post(EL_URL.format(voice=voice), timeout=300,
                          headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
                          json={"text": text, "model_id": "eleven_multilingual_v2"})
    else:
        if len(text) > 4096:
            sys.exit(f"OpenAI TTS takes 4096 chars max; script is {len(text)}. Split by scene.")
        r = requests.post(OA_TTS, timeout=300,
                          headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                          json={"model": "gpt-4o-mini-tts", "voice": voice or "alloy", "input": text,
                                "response_format": "mp3"})
    if r.status_code != 200:
        sys.exit(f"{provider} TTS failed {r.status_code}: {r.text[:300]}")
    with open(dest, "wb") as f:
        f.write(r.content)


def align(audio, local=False):
    if local:  # no API spend; needs `pip install faster-whisper` and huggingface.co reachable for the model
        from faster_whisper import WhisperModel
        segs, info = WhisperModel("base.en", compute_type="int8").transcribe(audio, word_timestamps=True)
        words = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
                 for s in segs for w in s.words]
        return words, info.duration
    with open(audio, "rb") as f:
        r = requests.post(OA_STT, timeout=600,
                          headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                          files={"file": (os.path.basename(audio), f)},
                          data={"model": "whisper-1", "response_format": "verbose_json",
                                "timestamp_granularities[]": "word"})
    if r.status_code != 200:
        sys.exit(f"Whisper failed {r.status_code}: {r.text[:300]}")
    d = r.json()
    return [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in d["words"]], d["duration"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text"); ap.add_argument("--audio"); ap.add_argument("--out")
    ap.add_argument("--voice"); ap.add_argument("--provider", default="auto",
                                                choices=["auto", "elevenlabs", "openai"])
    ap.add_argument("--local", action="store_true", help="align with local faster-whisper instead of the API")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        w = [{"word": x} for x in "Calls go unanswered at peak hour".split()]
        assert match_ratio("Calls go unanswered at peak hour.", w) == 1.0
        assert match_ratio("Calls go unanswered at peak hour.", w[:3]) < 0.9
        assert pick_provider("openai") == "openai"
        print("selftest ok"); return
    if not (a.text and a.out):
        ap.error("--text and --out are required")
    os.makedirs(a.out, exist_ok=True)
    script = open(a.text, encoding="utf-8").read().strip()
    voice = os.path.join(a.out, "voice.mp3")
    provider = "supplied"
    if a.audio:
        if os.path.abspath(a.audio) != os.path.abspath(voice):
            shutil.copyfile(a.audio, voice)
    else:
        provider = pick_provider(a.provider)
        tts(provider, script, a.voice, voice)
    words, duration = align(voice, a.local)
    meta = {"provider": provider, "voice": a.voice, "duration": duration, "words": len(words),
            "wordsPerSec": round(len(words) / duration, 2) if duration else 0,
            "scriptMatch": match_ratio(script, words)}
    json.dump(words, open(os.path.join(a.out, "words.json"), "w"), indent=1)
    json.dump(meta, open(os.path.join(a.out, "voice.json"), "w"), indent=1)
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
