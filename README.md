# finhub-video-editor-v2

Programmatic video studio (Remotion + GSAP + Motion + Tailwind/shadcn + ElevenLabs + Whisper + FFmpeg),
operated by a Claude Code agent team (Harness v2).

Ask Claude Code in this repo, for example: *"Make a 60 s 16:9 promo for X, CTA example.com"*. The
`video-studio` skill runs: planner → UI assets ∥ voice/captions → motion → render/master → QA fix loop →
your approval. Nothing is published without explicit confirmation.

```
.claude/agents/            video-planner, ui-asset-builder, audio-engineer, motion-designer, render-engineer, video-qa
.claude/skills/            video-studio, video-stack, remotion-motion, voice-captions, render-qa (folder skills)
                           remotion-rules.md, gsap-motion.md, audio-sync.md (quick references)
CLAUDE.md                  rules + commands
data/templates/            video-spec.json (starter scene spec)
data/outputs/              render manifests (generated)
pipelines/                 voice.ts (ElevenLabs) · transcribe.py (Whisper) · render.ts (render + master + probe)
src/app/                   index.ts (entry) · Root.tsx (PromoVideo, PromoVideo-9x16)
src/components/            ui/ (shadcn) · motion/ (GSAP/Motion primitives) · audio/ (captions, waveform)
src/compositions/PromoVideo/  Composition.tsx · SceneProblem · SceneSolution · SceneBooking · SceneOutro
src/styles/globals.css     Tailwind v4 (+ tailwind.config.js via @config)
public/                    fonts, logo, voice.mp3, words.json
```

```bash
npm ci
npm run studio                      # preview
npm run voice && npm run transcribe # needs an sk_ ElevenLabs key; OpenAI key with credits for Whisper API
npm run build:video                 # out/<slug>_<WxH>.mp4 + data/outputs/<manifest>.json
```

Needs Node 20+, Python 3.10+ with `requests` (plus `faster-whisper` for `--local`), and FFmpeg.
Remotion requires a Company Licence for for-profit teams of more than 3 people.
