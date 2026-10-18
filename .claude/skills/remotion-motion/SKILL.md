---
name: remotion-motion
description: "Rules for writing Remotion scenes, UI mockups and motion in studio/: frame-driven animation, Sequence timing, GSAP/Three.js/Lottie/Motion bridging, captions, fonts, assets and data-driven props. Use whenever code under studio/src is written or fixed: building a scene from the scene spec, porting a shadcn/Magic UI/React Bits component into a scene, adding a 3D shot, or fixing a QA finding about timing, clipping or flicker. Not for choosing libraries (video-stack) or rendering/encoding (render-qa)."
---

# Remotion Motion Rules

## The one rule everything follows

Remotion renders frames out of order and across parallel browser tabs. So **every visual value must be
a pure function of `useCurrentFrame()`**. Anything that keeps its own clock (CSS `transition`/`animation`,
`setTimeout`, `requestAnimationFrame`, Motion's `animate()`, GSAP's ticker, R3F's `useFrame`) renders
correctly in preview, then flickers or freezes in the final MP4. Most "works in Studio, broken in
render" bugs come from this.

## Project layout (created by render-engineer on the first run)

```
studio/
  src/Root.tsx              # registers <Composition id="Main"> with zod schema + calculateMetadata
  src/Main.tsx              # <Series> of scenes, <Audio> voice, <Captions>
  src/scenes/<scene-id>.tsx # one file per scene in the spec; the filename is the scene id
  src/ui/                   # ported shadcn/Magic UI/React Bits components, frame-driven
  src/lib/brand.ts          # colours, fonts, safe-area constants from spec.meta.brand
  public/                   # voice.mp3, words.json, images, lottie JSON (via staticFile())
```

The composition reads its props from `_workspace/01_planner_scenes.json` (passed with `--props`).
Duration comes from `calculateMetadata` (sum of scene lengths × fps), never a hard-coded number, so a
spec change re-times the whole video.

## Timing

- Frames = `Math.round(seconds * fps)`. Convert once, at the scene boundary. Never mix seconds and frames
  inside a component.
- Use `<Series>`/`<Series.Sequence durationInFrames>` for back-to-back scenes and `<Sequence from>` for
  overlays. Inside a Sequence, `useCurrentFrame()` is local (starts at 0).
- `interpolate(frame, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})`. Without
  clamping, values overshoot past the keyframe range.
- `spring({frame, fps, config: {damping: 200}})` for UI entrances; reserve bouncy springs for brand moments.
- Snap key beats to voice: a scene element tied to a word appears at
  `Math.round(word.start * fps) - sceneStartFrame`, from `public/words.json`.

## Bridging other engines

| Engine | Pattern |
| --- | --- |
| GSAP | Build `gsap.timeline({paused: true})` once in `useMemo`; in `useLayoutEffect` call `tl.seek(frame / fps)`. Kill it on unmount. |
| Motion / Motion Primitives | Use components for layout only. Replace `animate`/`transition` with values computed from `frame` and passed as `style`. |
| Anime.js | `createTimeline({autoplay: false})`, then `.seek(frame / fps * 1000)` in `useLayoutEffect`. |
| Three.js / R3F | Wrap in `<ThreeCanvas>` from `@remotion/three`; derive rotation/camera from `frame`; no `useFrame`. Dispose geometries/materials in cleanup so a long render does not leak GPU memory. |
| Lottie | `<Lottie animationData={...}>` from `@remotion/lottie`; load the JSON with `staticFile` + `delayRender`. |
| React Bits / Magic UI | Copy the source into `src/ui/`, delete its `@keyframes`/`transition` CSS, and re-drive the same properties from `frame`. |
| Manim / Motion Canvas / Revideo clip | Render separately to MP4 and place it with `<OffthreadVideo src={staticFile(...)}>`. |

## Assets, fonts, async

- Use `staticFile()`, `<Img>` and `<OffthreadVideo>`, not a raw `<img>`/`<video>`. Raw tags do not block
  rendering until loaded, so frames capture half-loaded images.
- Fonts come from `@remotion/google-fonts/<Font>` `loadFont()` or a local font with `delayRender`. A font
  that is not loaded yet renders in the fallback face for the first frames.
- Any fetch or async work goes behind `delayRender()`/`continueRender()`.

## Layout and legibility (QA checks these)

- Keep text inside the 5% title-safe margin (`brand.ts` exports `SAFE`). For 9:16, keep clear of the bottom
  20% and the right 15%, where platform UI sits.
- Minimum text size at 1080p: 40px for captions and body, 64px for headlines. Scale with `width / 1920`.
- Contrast ≥ 4.5:1 against the actual background behind the text, including video or gradient.
- Long strings: set `maxWidth` and test with the longest variant value, not the sample value.

## Captions

Read `public/words.json` (`[{word, start, end}]` in seconds). Group the words into pages of at most 7
words, or break at sentence punctuation. Highlight the word where `start ≤ t < end`. Render captions in
`Main.tsx` above all scenes so scene changes never cut a caption off.

## Compliance overlay (finance content)

If `spec.meta.compliance` is set, render its `disclaimer` text in the final scene (or persistently, if
`persistent: true`) at ≥ 28px. Keep it on screen for at least `minSeconds`. Never paraphrase it. It is
regulated wording.
