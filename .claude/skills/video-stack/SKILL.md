---
name: video-stack
description: "Picks the right library from the 28-repo Video-as-Code stack (engines, renderers, UI parts, sound, skills/MCP) for a scene or task, with install commands and licence gates. Use whenever a video-studio agent must choose between GSAP, Motion, Three.js/R3F, Lottie, Anime.js, Remotion, HyperFrames, Manim, Motion Canvas, Revideo, shadcn/ui, Magic UI, React Bits, Motion Primitives, Whisper, Tone.js, Wavesurfer, ElevenLabs, Blender MCP or After Effects MCP. Not for writing the animation code itself (use remotion-motion)."
---

# Video Stack Selector

The stack is wide on purpose, but one video should touch as few libraries as possible. Every extra
engine adds a bundle, a timing model to reconcile with Remotion's frame clock, and a licence to check.

## Default stack (use unless a scene needs more)

| Layer | Default | Why |
| --- | --- | --- |
| Composition + render | Remotion (`studio/`) | React props → deterministic frames; JSON-driven batch variants |
| Motion | Remotion `interpolate`/`spring`; GSAP timelines when sequencing is dense | Both can be driven from `useCurrentFrame()` |
| UI mockups | shadcn/ui + Tailwind | Real component code, so no fake screens |
| Voice | ElevenLabs, fallback OpenAI TTS | See voice-captions |
| Captions/timing | Whisper word timestamps | One alignment source for every voice provider |
| Encode/mux/master | FFmpeg | H.264 + AAC, loudness, resizing |

## Escalation rules (add a library only when the trigger is true)

| Trigger in the scene spec | Add | Notes |
| --- | --- | --- |
| 3D object, camera move, product spin | React Three Fiber (+ three) via `@remotion/three` | Never run R3F's own `useFrame` clock; derive from `useCurrentFrame()` |
| Designer supplied an After Effects/Bodymovin JSON | Lottie via `@remotion/lottie` | Do not hand-recreate an existing Lottie |
| Hero text effect, animated background | React Bits / Magic UI component copied into `studio/src/components/ui/` | Copy the source; strip CSS keyframes and re-drive from frame |
| Toolbar morph, cursor-driven app demo | Motion Primitives / Motion | Replace time-based transitions with frame-based values |
| SVG path draw, stagger grids | Anime.js or GSAP | Prefer GSAP if it is already in the bundle |
| Maths/algorithm explainer | Manim (Python) rendered to MP4, imported as `<OffthreadVideo>` | Separate render, then composite |
| Developer/architecture explainer with code blocks | Motion Canvas or Revideo as a standalone clip | Only if Remotion code highlighting is not enough |
| Procedural SFX, UI chimes | Tone.js offline render to WAV, then `<Audio>` | Render offline; never rely on live Web Audio during capture |
| Waveform visual for voice/podcast | `@remotion/media-utils` `visualizeAudio`; Wavesurfer.js for an editor UI | `visualizeAudio` is frame-safe |
| Heavy 3D scene, photoreal lighting | Blender MCP → rendered PNG sequence/MP4 | Needs Blender running locally; not available in cloud sessions |
| Client hands over an .aep | After Effects MCP | Needs AE on a desktop; out of scope for cloud runs |
| Need a component quickly from a description | Magic MCP (21st.dev) | Needs its API key; check each fetched component's licence |
| Remotion licence not held | HyperFrames (Apache-2.0) | Same HTML/GSAP mental model; see licence gate below |

## Licence gates (check before the first commercial render)

- **Remotion:** free only for individuals and for-profit organisations with up to 3 employees
  [verified: remotion@4.0.536 LICENSE.md]. A larger team needs a Company Licence. Without one, render
  with HyperFrames instead.
- **GSAP:** "Standard no-charge licence" [verified: npm gsap@3.15.0]. Read gsap.com/standard-license
  before shipping it inside a product.
- **ElevenLabs / OpenAI TTS:** paid APIs; the voice output terms are the provider's.
- Each React Bits / Magic UI / 21st.dev component: check its licence before copying it in.

Full repo table with install commands and verified licences: `references/repos.md`.
