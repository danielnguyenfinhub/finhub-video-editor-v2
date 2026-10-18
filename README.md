# finhub-video-editor-v2

Programmatic video studio (Remotion + GSAP + Motion + Tailwind/shadcn + ElevenLabs + Whisper + FFmpeg),
operated by a Claude Code agent team (Harness v2).

Ask Claude Code in this repo, for example: *"Make a 60 s 16:9 promo for X, CTA example.com"*. The
`video-studio` skill runs: planner → UI assets ∥ voice/captions → motion → render/master → QA fix loop →
your approval. Nothing is published without explicit confirmation.

```
agents/            video-planner, ui-asset-builder, audio-engineer, motion-designer, render-engineer, video-qa
skills/            video-studio, video-stack, remotion-motion, voice-captions, render-qa (folder skills)
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

## Install as a plugin (Cowork or Claude Code)

The repo is a plugin (`.claude-plugin/`) and its own marketplace. It brings the six agents, the skills and
the **finhub-video-studio connector**, an MCP server with `check_spec`, `make_voiceover`, `build_video`,
`get_job` and `list_outputs`.

- **Claude Code:** `/plugin marketplace add danielnguyenfinhub/finhub-video-editor-v2`, then
  `/plugin install finhub-video-studio@finhub-video`
- **Cowork:** add the same marketplace in Settings → Plugins (or upload the packaged `.plugin` file), then enable
  `finhub-video-studio`.
- **First run:** the connector runs `npm ci` once inside the plugin folder (about 1–2 minutes), then
  starts. The machine needs Node 20+, Python 3 with `requests`, and FFmpeg on the PATH.
- **API keys:** desktop apps don't see your shell variables, so put keys in a `.env` file in the studio folder:
  `GEMINI_API_KEY=…` (Charon voice), optionally `ELEVENLABS_API_KEY=sk_…` and `OPENAI_API_KEY=…`.
  To use your own clone instead of the plugin copy, set `STUDIO_DIR=/path/to/clone`.

## Hosted connector (any device, e.g. Railway)

The same server runs over HTTP: `npx tsx mcp/server.ts --http`, or `docker build .` with the included Dockerfile.
- **Variables:** `MCP_AUTH_TOKEN` (required; long random string), `PORT`, and the voice keys.
- **Connecting Cowork:** add a custom connector with URL `https://<host>/mcp` and header
  `Authorization: Bearer <MCP_AUTH_TOKEN>`.
- **Downloads:** finished MP4s are at `GET /files/<name>.mp4`, with the same header.
- **Costs:** renders take 2–3 minutes of CPU each, and hosting costs money.
- **Status:** the Dockerfile has not yet been build-tested.

Check the connector locally: `npx tsx mcp/smoke.ts`.

## Run locally

```bash
npm ci
npm run studio                      # preview
npm run voice && npm run transcribe # needs an sk_ ElevenLabs key; OpenAI key with credits for Whisper API
npm run build:video                 # out/<slug>_<WxH>.mp4 + data/outputs/<manifest>.json
```

Needs Node 20+, Python 3.10+ with `requests` (plus `faster-whisper` for `--local`), and FFmpeg.
Remotion requires a Company Licence for for-profit teams of more than 3 people.
