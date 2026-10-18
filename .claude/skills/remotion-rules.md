# Remotion rules: frame timing and hooks

Quick reference. The full rules are in `.claude/skills/remotion-motion/SKILL.md`.

## Time comes from the frame, never the clock
Remotion renders frames out of order and in parallel tabs, so anything with its own clock breaks in the MP4.
- Allowed: `useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, `spring()`.
- Never: CSS `transition`/`animation`, `setTimeout`, `setInterval`, `requestAnimationFrame`, `Math.random()`.

```tsx
const frame = useCurrentFrame();
const {fps} = useVideoConfig();
const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const scale = spring({frame, fps, config: {damping: 200}}); // UI entrances; bouncier configs for brand moments only
```

## Structure
- Use `<Series>` for back-to-back scenes and `<Sequence from durationInFrames>` for overlays. Inside a Sequence the frame is local and starts at 0.
- Seconds become frames once, at the scene boundary: `Math.round(sec * fps)`.
- Duration comes from the spec via `calculateMetadata` in `src/app/Root.tsx`. Never hard-code `durationInFrames`.
- Dimensions come from the spec (`meta.width/height/fps`). `PromoVideo-9x16` reuses the same scenes, laid out with `safeFor(w, h)` from `src/lib/brand.ts`.

## Assets
- Use `staticFile()`, `<Img>`, `<OffthreadVideo>` and `<Audio>`. Never use a raw `<img>`/`<video>`: they don't hold the frame until they've loaded.
- Fonts are bundled locally in `public/fonts`, loaded with `@remotion/fonts`. Never use a network font, which can hang or change between renders.
- Async work goes behind `delayRender()`/`continueRender()`, or into `calculateMetadata`.

## Check before handing off
```bash
npm run typecheck
grep -rnE "transition:|@keyframes|setTimeout|setInterval|requestAnimationFrame|Math.random|useFrame\(" src/   # must be empty
```
