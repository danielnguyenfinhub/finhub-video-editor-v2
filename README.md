# finhub-video-editor-v2

Video-as-Code studio driven by a Claude Code agent team (Harness v2).

Ask Claude Code in this repo, for example: *"Make a 60 s 16:9 promo for X, CTA example.com"*. The
`video-studio` skill runs: planner → UI assets ∥ voice/captions → motion → render/master → QA fix loop →
your approval. Nothing is published without explicit confirmation.

| Path | What |
| --- | --- |
| `.claude/agents/` | video-planner, ui-asset-builder, audio-engineer, motion-designer, render-engineer, video-qa |
| `.claude/skills/video-studio/` | Orchestrator, scene-spec contract, `check_spec.py` |
| `.claude/skills/video-stack/` | The 28-repo catalogue: when to use each, installs, licence gates |
| `.claude/skills/remotion-motion/` | Frame-driven Remotion/GSAP/Three.js/Lottie rules |
| `.claude/skills/voice-captions/` | `voiceover.py`: TTS + Whisper word timings |
| `.claude/skills/render-qa/` | Render/master recipe and `probe.py` MP4 checks |
| `studio/` | Remotion project (scaffolded on first run) |

Needs Node 18+, Python 3 with `requests`, FFmpeg, and an `sk_` ElevenLabs key and/or OpenAI key with
credits. Remotion requires a Company Licence for for-profit teams of more than 3 people.
