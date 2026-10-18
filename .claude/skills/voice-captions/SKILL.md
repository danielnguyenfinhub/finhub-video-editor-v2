---
name: voice-captions
description: "Generates the voiceover (ElevenLabs, fallback OpenAI TTS) and word-level timings (Whisper) that drive captions and keyframe sync, plus optional Tone.js SFX. Use when a video needs narration, re-voicing after a script change, captions for supplied audio, or a check that narration fits scene lengths. Not for mixing/loudness of the final MP4 (render-qa) or for writing the script (video-planner)."
---

# Voice and Captions

Script text → voice audio → Whisper word timestamps → `words.json`, which motion and captions snap to.
Whisper aligns every voice, whichever provider made it, so captions never depend on a
provider-specific alignment format.

## Steps

1. Build the narration text from `_workspace/01_planner_scenes.json`: join each scene's `voiceover` in
   scene order, separated by a blank line. Save it to `_workspace/03_audio_script.txt`.
2. Check the pace before spending credits. For each scene,
   `words(voiceover) ≤ 2.5 × (endSec − startSec)`. If a scene fails, stop and report it to the planner
   with the over-length scenes. Do not speed the voice up to make it fit; rushed TTS sounds synthetic.
3. Generate and align:
   ```bash
   python3 .claude/skills/voice-captions/scripts/voiceover.py \
     --text _workspace/03_audio_script.txt --out public [--voice <id>] [--local]
   ```
   The script prints `{provider, duration, words, wordsPerSec, scriptMatch}` and writes
   `public/{voice.mp3, words.json, voice.json}`.
4. Accept only if `scriptMatch ≥ 0.9` and `duration ≤ total spec length + 0.5 s`. A low match means the
   voice skipped or mangled a line, so regenerate once; if it is still low, report the lines that differ.
5. Write `_workspace/03_audio_report.md` with the meta JSON, the scene-by-scene fit, and any SFX added.

## Provider order and failures

| Situation | Action |
| --- | --- |
| `ELEVENLABS_API_KEY` starts with `sk_` | ElevenLabs (`eleven_multilingual_v2`); `--voice` is required |
| Key missing or is a key ID | OpenAI `gpt-4o-mini-tts`, voice `alloy` unless the spec names one |
| Both TTS APIs fail with auth or quota (401/403/429 quota) | Do not retry; retries burn nothing but time. If the session has the ElevenLabs MCP, use `creative_generate_speech`, save the MP3, then run the script with `--audio`. Otherwise report **Blocked: voice provider** |
| Whisper API out of quota | Re-run with `--local` (faster-whisper; needs huggingface.co reachable once to fetch the model) |
| Client supplied a recorded voice | `--audio file.mp3`; skip TTS |

Australian English is the default accent. Vietnamese narration only when the spec says
`"language": "vi"`; then keep the multilingual ElevenLabs model and check `scriptMatch` on the
Vietnamese text (Whisper handles diacritics, but expect a lower ratio, so accept ≥ 0.85).

## SFX (optional, from spec `sfx`)

Render Tone.js cues offline (`Tone.Offline`) to WAV in `public/sfx/`, named `<sceneId>-<cue>.wav`,
and list them with their trigger word in the report. Keep SFX peaks at least 12 dB under the voice.
