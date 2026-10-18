# Audio sync: subtitle and voice alignment

Quick reference. The full procedure is in `.claude/skills/voice-captions/SKILL.md`.

## Pipeline
```bash
npm run voice        # pipelines/voice.ts: spec voiceovers -> ElevenLabs -> public/voice.mp3 (pace check first)
npm run transcribe   # pipelines/transcribe.py: Whisper word timestamps -> public/words.json
```
- `words.json` is `[{word, start, end}]` in seconds, and is the single timing source for captions and beats.
- Whisper aligns every voice, whichever provider made it, so caption timing never depends on the provider.
- Fallbacks:
  - `ELEVENLABS_API_KEY` must start with `sk_`. A key ID fails, and `voice.ts` stops before calling the API.
  - OpenAI TTS: `python3 .claude/skills/voice-captions/scripts/voiceover.py --text <txt> --out public`
  - Whisper offline: `python3 pipelines/transcribe.py <audio> <out> --local` (faster-whisper; needs huggingface.co once to fetch the model)

## Rules
- Pace: each scene's voiceover has at most 2.5 words per second of scene time. Fix the script, never speed up the voice.
- Accept a voice only if the transcript matches the script at a ratio of 0.9 or more (0.85 for Vietnamese) and it fits the spec length +0.5 s.
- Captions (`src/components/audio/Captions.tsx`): pages of at most 7 words, broken at sentence punctuation. The active word is the one where `start ≤ t < end`. Captions render above all scenes, so a scene cut never clips them.
- Beats: `beatFrame(words, scene, trigger, fps)`. A trigger word that isn't found falls back to even spacing, and the motion notes must say so.
- Without `public/voice.mp3`, `words.json` is **provisional** (evenly spaced). Say so in every report until a real voice exists.
- Mastering: −14 LUFS, true peak ≤ −1 dBTP (master at TP −2 to absorb AAC overshoot). SFX peaks at least 12 dB under the voice.
