# FinHub Video Editor v2

## Harness: Video-as-Code studio

**Goal:** Turn a product brief into a QA-checked, human-approved MP4 using the 28-repo programmatic
video stack (Remotion + GSAP + shadcn/ui + ElevenLabs/Whisper + FFmpeg by default).

**Trigger:** For any request to make, edit, re-render, resize, re-voice or batch a video, use the
`video-studio` skill. Simple questions about the stack can be answered directly (see `video-stack`).

**Critical Remotion rules** (details in the `remotion-motion` skill):
1. All time derives from `useCurrentFrame()`/`useVideoConfig()`. No CSS transitions/animations, `setTimeout`,
   `setInterval`, `requestAnimationFrame` or `Math.random`: frames render out of order and in parallel.
2. GSAP/Motion/Three.js run only through frame-seeked wrappers in `src/components/motion/`.
3. Duration comes from the spec via `calculateMetadata`, never a hard-coded `durationInFrames`.
4. Each scene is `src/compositions/PromoVideo/Scene<Name>.tsx`, registered in the `SCENES` map in `Composition.tsx`.

Connector: `mcp/server.ts` (tools check_spec, make_voiceover, build_video, get_job, list_outputs; smoke test `npx tsx mcp/smoke.ts`).

Quick references (read before writing scene, motion or audio code): `skills/remotion-rules.md`,
`skills/gsap-motion.md`, `skills/audio-sync.md`.

**Commands** (repo root):
| Task | Command |
| --- | --- |
| Preview | `npm run studio` |
| Typecheck | `npm run typecheck` |
| Voiceover (ElevenLabs) | `npm run voice` (`pipelines/voice.ts`) |
| Word timestamps (Whisper) | `npm run transcribe` (`pipelines/transcribe.py`, add `--local` for offline) |
| Render + master + probe + manifest | `npm run build:video -- --spec <spec.json> --comp PromoVideo` (`pipelines/render.ts`) |
| QA probe only | `python3 skills/render-qa/scripts/probe.py out/<file>.mp4 --spec <spec.json>` |

Specs start from `data/templates/video-spec.json`; render manifests land in `data/outputs/`.
In cloud sessions set `REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -name headless_shell | head -1)`
(or pass `--browser-executable`) because remotion.media is blocked.

**Change log:**
| Date | Change | Target | Reason |
| --- | --- | --- | --- |
| 2026-10-18 | Initial Harness v2 build: 6 agents, 5 skills, mixed Workflow orchestration | All | Build the studio from the 28-repo brief |
| 2026-10-18 | Studio constructed by the team: guide layout (`app/`, `components/{ui,motion,audio}`, `compositions/PromoVideo`), composition id `Main` → `PromoVideo`, starter spec in `data/templates/` | studio/, agents, skills | User's "AI Video Studio" guide |
| 2026-10-18 | Remotion project moved from `studio/` to repo root; added `pipelines/{voice.ts,transcribe.py,render.ts}`, `tailwind.config.js` (via `@config`), `data/outputs/`, flat quick-reference skill notes; scenes renamed `Scene*.tsx` | Root, agents, skills | User's exact repo structure |
| 2026-10-18 | Repo is now a plugin + marketplace (`.claude-plugin/`, `.mcp.json`): skills/agents moved to root `skills/`, `agents/` (`.claude/*` are symlinks); `mcp/server.ts` connector (stdio + `--http` with bearer auth), `mcp/start.mjs` launcher, Dockerfile | Root, skills, mcp | Use in Claude Cowork as a connector with plugin and skills |
