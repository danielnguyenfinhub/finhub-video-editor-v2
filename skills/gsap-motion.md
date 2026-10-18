# GSAP and Motion: design, easing, coordinates

Quick reference for `src/components/motion/`. Reuse what's there before writing new primitives:
`FadeIn`, `SlideUp`, `SpringScale`, `useRamp`, `useSpringAt`, `useGsapTimeline`, `beatFrame`.

## GSAP in Remotion
Never let GSAP's own ticker run. Build the timeline paused, then seek it to the current frame:
```tsx
useGsapTimeline((tl) => {
  tl.to(ref.current, {y: -120, duration: 0.4, ease: 'power3.out'}, 0.5); // positions in seconds, Sequence-local
}, []);
// the hook builds the paused timeline in useLayoutEffect, seeks it to frame / fps every frame, kills it on unmount
```

## Motion (motion.dev, formerly framer-motion)
- Use `motion` components for layout only. Never `animate()`, `transition` props or `whileInView`, which run on their own clock.
- Compute values from the frame (`interpolate`/`spring`) and pass them as `style`.
- The npm package is `motion`. `@remotion/motion` does not exist.

## Easing defaults
| Use | Remotion | GSAP |
| --- | --- | --- |
| UI entrance | `spring({damping: 200})` | `power3.out`, 0.4–0.6 s |
| Exit | `Easing.in(Easing.cubic)` | `power2.in`, 0.25–0.35 s |
| Emphasis / brand beat | `spring({damping: 12, stiffness: 200})` | `back.out(1.7)` |
| Count-up numbers | `interpolate` linear plus `Math.round` | `none` |

Exits should be shorter than entrances. Stagger lists by 3–5 frames, never all at once.

## Coordinates and layout
- The design box is 1920×1080. Scale with `scale(width)` = width / 1920. Keep text inside `SAFE` (5% margins).
- In 9:16, keep clear of the bottom 20% and the right 15% (platform UI). Use `safeFor(width, height)`.
- Minimum text size at 1080p: 40px body and captions, 64px headlines.
- Snap every beat to a word: `beatFrame(words, scene, 'booking', fps)` returns the scene-local frame.
