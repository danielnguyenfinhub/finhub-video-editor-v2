# The 28 repositories

Versions and licences were checked against the npm and PyPI registries on 2026-10-18. `[unverified]`
means the registry had no package to check against. Two paths in the source brief were wrong and are
corrected here: HyperFrames lives at `heygen-com/hyperframes`, and Revideo has moved to `midrender/revideo`.

| # | Tool | Layer | Repo | Install | Licence |
| --- | --- | --- | --- | --- | --- |
| 1 | Three.js | Engine | mrdoob/three.js | `npm i three` | MIT (0.186.1) |
| 2 | Anime.js | Engine | juliangarnier/anime | `npm i animejs` | MIT (4.5.0) |
| 3 | Motion | Engine | motiondivision/motion | `npm i motion` | MIT (14.3.0) |
| 4 | React Three Fiber | Engine | pmndrs/react-three-fiber | `npm i @react-three/fiber @remotion/three` | MIT (9.8.2) |
| 5 | Lottie-web | Engine | airbnb/lottie-web | `npm i @remotion/lottie lottie-web` | MIT (5.13.0) |
| 6 | GSAP | Engine | greensock/GSAP | `npm i gsap` | Standard no-charge (3.15.0) |
| 7 | FFmpeg | Render | FFmpeg/FFmpeg | system binary (`ffmpeg`, `ffprobe`) | LGPL/GPL by build |
| 8 | Remotion | Render | remotion-dev/remotion | `npx create-video@latest` | Custom: free ≤3 employees (4.0.536) |
| 9 | HyperFrames | Render | heygen-com/hyperframes | `npx skills add heygen-com/hyperframes` | Apache-2.0 (0.8.169) |
| 10 | Manim | Render | ManimCommunity/manim | `pip install manim` | MIT (0.22.0) |
| 11 | Motion Canvas | Render | motion-canvas/motion-canvas | `npm init @motion-canvas@latest` | MIT (3.17.2) |
| 12 | Revideo | Render | midrender/revideo | `npm i @revideo/core` | MIT (0.11.0) |
| 13 | shadcn/ui | UI | shadcn-ui/ui | `npx shadcn@latest add <component>` | MIT (4.22.0) |
| 14 | React Bits | UI | DavidHDev/react-bits | copy from reactbits.dev | [unverified] |
| 15 | Magic UI | UI | magicuidesign/magicui | `npx shadcn@latest add "https://magicui.design/r/<name>"` | MIT |
| 16 | Motion Primitives | UI | ibelick/motion-primitives | copy from motion-primitives.com | MIT |
| 17 | Magic MCP | UI | 21st-dev/magic-mcp | `npx @21st-dev/magic` (MCP, API key) | ISC (0.2.3) |
| 18 | Whisper | Sound | openai/whisper | API `whisper-1` or `pip install openai-whisper` | MIT (20250625) |
| 19 | Tone.js | Sound | Tonejs/Tone.js | `npm i tone` | MIT (15.1.22) |
| 20 | Wavesurfer.js | Sound | katspaugh/wavesurfer.js | `npm i wavesurfer.js` | BSD-3-Clause (8.0.2) |
| 21 | ElevenLabs SDK | Sound | elevenlabs/elevenlabs-js | `npm i @elevenlabs/elevenlabs-js` | MIT (2.73.0); service is paid |
| 22 | Anthropic Skills | Skills | anthropics/skills | skill format these agents follow | [unverified] |
| 23 | Blender MCP | Skills/MCP | ahujasid/blender-mcp (brief said `ahrm`) [unverified] | MCP + local Blender | [unverified] |
| 24 | GSAP Skills | Skills | encoded in `remotion-motion` | none | n/a |
| 25 | Remotion Skills | Skills | encoded in `remotion-motion` | none | n/a |
| 26 | Three.js Skills | Skills | encoded in `remotion-motion` | none | n/a |
| 27 | After Effects MCP | Skills/MCP | community ExtendScript bridge | MCP + local AE | [unverified] |
| 28 | Motion Graphics Skills | Skills | encoded in `video-studio` + agent definitions | none | n/a |

Items 24–28 are skill specs rather than libraries. This harness implements them as project skills
instead of pulling external rulebooks, so they stay versioned with the repo.
