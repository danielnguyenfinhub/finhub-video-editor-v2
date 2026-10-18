# Owner profile: Daniel Nguyen / FinHub

Facts the planner and builders use by default. Each fact is sourced from the reference repo
`danielnguyenfinhub/finhub-video-editor` (read 2026-10-18). Facts only: do not copy that repo's structure,
templates or concept. A brief that says otherwise wins.

| Fact | Value | Source |
| --- | --- | --- |
| Who | Daniel, mortgage broker (FinHub / Finance Hub and Networks), not a developer | `AGENTS.md` line 7 |
| Language | Every owner video is **bilingual**: Vietnamese main line plus a smaller English line, sharing the same timing and kept as separate strings. Keep every diacritic and normalise text with NFC | `AGENTS.md` "Language" |
| Brand colours | primary/logo blue `#0064A8`, background navy `#0B1F3D`, deep navy `#06132A`, accent amber `#F5A524`, highlight `#FFB938`, slate `#5B6B80`, text on dark `#ffffff` / dim `#c9d3e6` | `src/brand/theme.ts` |
| Font | **Be Vietnam Pro**, which has every Vietnamese diacritic. Inter's latin subset does not, so a Vietnamese video must load Be Vietnam Pro (e.g. `@fontsource/be-vietnam-pro`, OFL) | `src/brand/theme.ts`, `public/fonts/` |
| Logo | The "NETWORKS" wordmark is black, so the logo always sits on a **white card**. Four of the five trust badges also need a light background | `src/brand/theme.ts`, `docs/agents/brand-assets.md` |
| Lender logos | Only logos of lenders Daniel is accredited with, following each lender's broker brand guidelines (no recolouring, clear space) | `docs/agents/brand-assets.md` |
| Default voice | Google **Gemini TTS, voice "Charon"** (male, informative). Model `gemini-2.5-pro-preview-tts`, falling back to `gemini-2.5-flash-preview-tts` at the daily cap. Returns raw 24 kHz 16-bit mono PCM | `scripts/voice-video.mjs` lines 19–20, 292–301 |
| Vietnamese with ElevenLabs | Use `eleven_v3`; `eleven_multilingual_v2` doesn't speak Vietnamese well | `scripts/voice-video.mjs` line 66 |
| API keys | Read keys only in Node/Python scripts, **never in a `.tsx` component**, because Remotion exposes `.env` to the browser bundle | `docs/agents/api-keys.md` |
| Contact details | **None are stored in the source.** The CTA website and phone must come from Daniel per video | `docs/agents/brand-assets.md` ("EndCard") |
| Compliance | Credit/rate content follows ASIC RG 234: no rate without a comparison rate, and a disclaimer does not cure a misleading claim | `scripts/voice-video.mjs` line 208, `.claude/skills/video-compliance-review` (reference repo) |

## How the planner applies this
- For a FinHub video, use `meta.language: "vi+en"`, the brand colours above, Be Vietnam Pro, and the logo on a white card.
- For a client or product promo (like the ReceptionAI starter spec), keep that product's brand, but never invent a CTA URL or phone number. Leave a `[CTA_URL]` placeholder and ask.
- Voice default: Gemini Charon when `GEMINI_API_KEY` works, then ElevenLabs (`sk_` key), then OpenAI TTS.
