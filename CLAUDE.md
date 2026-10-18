# FinHub Video Editor v2

## Harness: Video-as-Code studio

**Goal:** Turn a product brief into a QA-checked, human-approved MP4 using the 28-repo programmatic
video stack (Remotion + GSAP + shadcn/ui + ElevenLabs/Whisper + FFmpeg by default).

**Trigger:** For any request to make, edit, re-render, resize, re-voice or batch a video, use the
`video-studio` skill. Simple questions about the stack can be answered directly (see `video-stack`).

**Critical Remotion rules** (details in the `remotion-motion` skill):
1. All time derives from `useCurrentFrame()`/`useVideoConfig()`. No CSS transitions/animations, `setTimeout`,
   `setInterval`, `requestAnimationFrame` or `Math.random`: frames render out of order and in parallel.
2. GSAP/Motion/Three.js run only through frame-seeked wrappers in `studio/src/components/motion/`.
3. Duration comes from the spec via `calculateMetadata`, never a hard-coded `durationInFrames`.

**Commands** (run from `studio/`):
| Task | Command |
| --- | --- |
| Preview | `npm run studio` |
| Typecheck | `npm run typecheck` |
| Render | `npx remotion render src/index.ts PromoVideo ../out/raw.mp4 --props=../_workspace/01_planner_scenes.json` |
| Voice + word timings | `python3 ../.claude/skills/voice-captions/scripts/voiceover.py --text <script.txt> --out public` |
| QA probe | `python3 ../.claude/skills/render-qa/scripts/probe.py ../out/<file>.mp4 --spec <spec.json>` |

In cloud sessions add `--browser-executable=$(find /opt/pw-browsers -name headless_shell | head -1)` to
render/still commands (remotion.media is blocked).

**Change log:**
| Date | Change | Target | Reason |
| --- | --- | --- | --- |
| 2026-10-18 | Initial Harness v2 build: 6 agents, 5 skills, mixed Workflow orchestration | All | Build the studio from the 28-repo brief |
| 2026-10-18 | Studio constructed by the team: guide layout (`app/`, `components/{ui,motion,audio}`, `compositions/PromoVideo`), composition id `Main` → `PromoVideo`, starter spec in `data/templates/` | studio/, agents, skills | User's "AI Video Studio" guide |
