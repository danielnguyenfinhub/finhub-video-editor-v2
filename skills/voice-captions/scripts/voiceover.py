#!/usr/bin/env python3
"""Voiceover + word timings for the video studio.

  voiceover.py --text script.txt --out public [--voice ID] [--provider auto|gemini|elevenlabs|fal|openai]
  voiceover.py --audio existing.mp3 --text script.txt --out public   # align only
  add --local to align with faster-whisper on this machine (no API credits needed)
  voiceover.py --selftest

Writes <out>/voice.mp3, <out>/words.json ([{word,start,end}] seconds) and <out>/voice.json (meta).
Whisper is the timing source for every provider, so captions behave the same whatever voiced them. If
Whisper is unavailable, fal's own word timings are used instead (voice.json "timing": "tts").
"""
import argparse, base64, difflib, json, math, os, re, shutil, struct, subprocess, sys, tempfile
import requests

EL_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
GEM_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
FAL_TTS = "https://fal.run/fal-ai/elevenlabs/tts/eleven-v3"  # ElevenLabs v3 billed through fal, no sk_ key needed
OA_TTS = "https://api.openai.com/v1/audio/speech"
OA_STT = "https://api.openai.com/v1/audio/transcriptions"


def norm(text):
    return re.findall(r"[a-z0-9']+", text.lower())


def match_ratio(script, words):
    """How closely the transcript matches the script. Below ~0.9 usually means a mispronounced or skipped line."""
    return round(difflib.SequenceMatcher(None, norm(script), norm(" ".join(w["word"] for w in words))).ratio(), 3)


class Fail(Exception):
    """A provider could not produce audio (auth, quota, no audio). Auto mode moves on; explicit mode exits."""


def pick_provider(choice, env=os.environ):
    """Ordered provider list. auto = gemini (key set) -> elevenlabs (sk_ key; a key ID authenticates nothing)
    -> fal (key set) -> openai."""
    if choice != "auto":
        return [choice]
    return ([p for p, ok in (("gemini", env.get("GEMINI_API_KEY")),
                             ("elevenlabs", env.get("ELEVENLABS_API_KEY", "").startswith("sk_")),
                             ("fal", env.get("FAL_KEY"))) if ok]
            + ["openai"])


def pcm_to_mp3(pcm, dest):
    """Raw 24 kHz 16-bit mono PCM -> mp3."""
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1",
                        "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "128k", dest],
                       input=pcm, capture_output=True)
    if r.returncode:
        raise Fail(f"ffmpeg failed: {r.stderr.decode()[:200]}")


def gemini_tts(text, voice, dest):
    voice = voice or os.environ.get("GEMINI_VOICE") or "Charon"
    models = [os.environ["GEMINI_TTS_MODEL"]] if os.environ.get("GEMINI_TTS_MODEL") else \
        ["gemini-2.5-pro-preview-tts", "gemini-2.5-flash-preview-tts"]
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    why = "no models"
    for i, model in enumerate(models):
        for _ in range(3):  # preview models sometimes return 200 with no audio: 1 try + 2 retries
            r = requests.post(GEM_URL.format(model=model), timeout=300, json=body,
                              headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]})
            if r.status_code in (401, 403):
                raise Fail(f"gemini auth {r.status_code}: {r.text[:200]}")
            if r.status_code == 429:
                why = f"{model} quota 429"
                break  # next model; on the last one we fall out and fail
            if r.status_code != 200:
                raise Fail(f"gemini {model} {r.status_code}: {r.text[:200]}")
            parts = ((r.json().get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
            pcm = b"".join(base64.b64decode(p["inlineData"]["data"]) for p in parts if p.get("inlineData"))
            if pcm:
                return pcm_to_mp3(pcm, dest)
            why = f"{model} returned no audio"
    raise Fail(f"gemini: {why}")


def chars_to_words(chunks):
    """fal/ElevenLabs character timings -> [{word,start,end}], split on whitespace."""
    words, cur = [], None
    for c in chunks:
        for ch, a, b in zip(c["characters"], c["character_start_times_seconds"], c["character_end_times_seconds"]):
            if ch.isspace():
                cur = None
            elif cur is None:
                cur = {"word": ch, "start": round(a, 3), "end": round(b, 3)}; words.append(cur)
            else:
                cur["word"] += ch; cur["end"] = round(b, 3)
    return words


def fal_tts(text, voice, dest):
    body = {"text": text, "timestamps": True}
    if voice:
        body["voice"] = voice  # ElevenLabs voice name or ID; fal's default is "Rachel"
    r = requests.post(FAL_TTS, timeout=600, json=body, headers={"Authorization": f"Key {os.environ['FAL_KEY']}"})
    if r.status_code != 200:
        raise Fail(f"fal TTS failed {r.status_code}: {r.text[:300]}")
    d = r.json()
    try:  # the audio is served from fal.media, a different host from the API
        audio = requests.get(d["audio"]["url"], timeout=300)
        audio.raise_for_status()
    except requests.RequestException as e:
        raise Fail(f"fal audio download failed: {e}")
    with open(dest, "wb") as f:
        f.write(audio.content)
    return chars_to_words(d.get("timestamps") or [])


def tts(provider, text, voice, dest):
    """Writes dest; returns the provider's own word timings when it has them, else None."""
    if provider == "fal":
        return fal_tts(text, voice, dest)
    if provider == "gemini":
        return gemini_tts(text, voice, dest)
    if provider == "elevenlabs":
        if not voice:
            raise Fail("ElevenLabs needs --voice <voice_id> (list voices in the ElevenLabs app or MCP).")
        # eleven_v3 for Vietnamese: multilingual_v2 doesn't speak it well
        r = requests.post(EL_URL.format(voice=voice), timeout=300,
                          headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
                          json={"text": text, "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")})
    else:
        if len(text) > 4096:
            raise Fail(f"OpenAI TTS takes 4096 chars max; script is {len(text)}. Split by scene.")
        r = requests.post(OA_TTS, timeout=300,
                          headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                          json={"model": "gpt-4o-mini-tts", "voice": voice or "alloy", "input": text,
                                "response_format": "mp3"})
    if r.status_code != 200:
        raise Fail(f"{provider} TTS failed {r.status_code}: {r.text[:300]}")
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
        raise Fail(f"Whisper failed {r.status_code}: {r.text[:300]}")
    d = r.json()
    return [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in d["words"]], d["duration"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text"); ap.add_argument("--audio"); ap.add_argument("--out")
    ap.add_argument("--voice"); ap.add_argument("--provider", default="auto",
                                                choices=["auto", "gemini", "elevenlabs", "fal", "openai"])
    ap.add_argument("--local", action="store_true", help="align with local faster-whisper instead of the API")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        w = [{"word": x} for x in "Calls go unanswered at peak hour".split()]
        assert match_ratio("Calls go unanswered at peak hour.", w) == 1.0
        assert match_ratio("Calls go unanswered at peak hour.", w[:3]) < 0.9
        assert pick_provider("openai") == ["openai"]
        assert pick_provider("auto", {"GEMINI_API_KEY": "g", "ELEVENLABS_API_KEY": "sk_x"}) == ["gemini", "elevenlabs", "openai"]
        assert pick_provider("auto", {"ELEVENLABS_API_KEY": "sk_x"}) == ["elevenlabs", "openai"]
        assert pick_provider("auto", {"ELEVENLABS_API_KEY": "keyid"}) == ["openai"]
        assert pick_provider("auto", {"ELEVENLABS_API_KEY": "keyid", "FAL_KEY": "f"}) == ["fal", "openai"]
        chunks = [{"characters": list("Hi there"), "character_start_times_seconds": [i * .1 for i in range(8)],
                   "character_end_times_seconds": [i * .1 + .1 for i in range(8)]},
                  {"characters": list(" now."), "character_start_times_seconds": [.8, .9, 1, 1.1, 1.2],
                   "character_end_times_seconds": [.9, 1, 1.1, 1.2, 1.3]}]
        assert chars_to_words(chunks) == [{"word": "Hi", "start": 0, "end": .2}, {"word": "there", "start": .3, "end": .8},
                                          {"word": "now.", "start": .9, "end": 1.3}], chars_to_words(chunks)
        pcm = b"".join(struct.pack("<h", int(8000 * math.sin(2 * math.pi * 440 * i / 24000))) for i in range(12000))
        with tempfile.TemporaryDirectory() as d:
            mp3 = os.path.join(d, "t.mp3"); pcm_to_mp3(pcm, mp3)
            dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                                 "-of", "csv=p=0", mp3]))
            assert 0.4 < dur < 0.7, dur
        print("selftest ok"); return
    if not (a.text and a.out):
        ap.error("--text and --out are required")
    os.makedirs(a.out, exist_ok=True)
    script = open(a.text, encoding="utf-8").read().strip()
    voice = os.path.join(a.out, "voice.mp3")
    provider, tried, tts_words = "supplied", [], None
    if a.audio:
        if os.path.abspath(a.audio) != os.path.abspath(voice):
            shutil.copyfile(a.audio, voice)
    else:
        order = pick_provider(a.provider)
        if a.provider == "auto":
            tried += [{"provider": p, "error": "skipped: " + why} for p, why in (
                ("gemini", "GEMINI_API_KEY not set"), ("elevenlabs", "ELEVENLABS_API_KEY missing or not an sk_ key"),
                ("fal", "FAL_KEY not set"))
                if p not in order]
        for provider in order:
            try:
                tts_words = tts(provider, script, a.voice, voice); break
            except Fail as e:
                tried.append({"provider": provider, "error": str(e)})
                print(f"{provider} failed: {e}", file=sys.stderr)
        else:
            os.makedirs(a.out, exist_ok=True)
            json.dump({"provider": None, "tried": tried}, open(os.path.join(a.out, "voice.json"), "w"), indent=1)
            sys.exit("Blocked: voice provider. Tried: " + "; ".join(f"{t['provider']} ({t['error'][:120]})" for t in tried))
    timing = "whisper-local" if a.local else "whisper"
    try:
        words, duration = align(voice, a.local)
    except Fail as e:
        if not tts_words:
            sys.exit(str(e))
        # scriptMatch is then not an independent check: the timings come from the same TTS call
        print(f"{e}; using the provider's own word timings", file=sys.stderr)
        words, timing = tts_words, "tts"
        duration = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                                  "-of", "csv=p=0", voice]))
    meta = {"provider": provider, "voice": a.voice, "timing": timing, "duration": duration, "words": len(words),
            "wordsPerSec": round(len(words) / duration, 2) if duration else 0,
            "scriptMatch": match_ratio(script, words), "tried": tried}
    json.dump(words, open(os.path.join(a.out, "words.json"), "w"), indent=1)
    json.dump(meta, open(os.path.join(a.out, "voice.json"), "w"), indent=1)
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
