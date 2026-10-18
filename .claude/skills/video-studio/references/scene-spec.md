# Scene spec: the contract between agents

`_workspace/01_planner_scenes.json` is the only handoff every agent reads. It doubles as the Remotion
`--props` file, so a change here re-times and re-renders the whole video with no code edits.

```json
{
  "meta": {
    "slug": "ai-receptionist-salon",
    "title": "AI Receptionist for Nail Salons",
    "language": "en-AU",
    "fps": 30, "width": 1920, "height": 1080,
    "brand": {"primary": "#0F172A", "accent": "#F472B6", "font": "Inter", "logo": "public/logo.svg"},
    "audience": "US nail-salon owners, 1–3 locations",
    "cta": {"text": "Start free at example.com", "url": "https://example.com"},
    "voice": {"provider": "auto", "voiceId": null},
    "compliance": null
  },
  "scenes": [
    {
      "id": "s01-problem",
      "startSec": 0, "endSec": 10,
      "goal": "Owner feels the cost of missed calls",
      "voiceover": "Every missed call during peak hour is a booking walking out the door.",
      "onScreenText": ["Missed call", "3 bookings lost today"],
      "visual": "Busy salon counter; phone toast stacking unanswered",
      "ui": ["IncomingCallToast"],
      "motion": "Toasts stack with spring, counter ticks up on the word 'booking'",
      "libs": ["gsap"],
      "sfx": [{"cue": "ring", "atWord": "missed"}],
      "notes": ""
    }
  ],
  "variants": [
    {"id": "glamour-nails", "meta": {"brand": {"accent": "#A855F7"}, "cta": {"text": "glamour.example.com"}}}
  ]
}
```

## Rules the planner must satisfy (QA re-checks them)

| Rule | Why |
| --- | --- |
| Scenes are contiguous: `scenes[i].endSec == scenes[i+1].startSec`, first starts at 0 | `calculateMetadata` sums them; gaps become black frames |
| `words(voiceover) ≤ 2.5 × (endSec − startSec)` | ~150 wpm is the ceiling for clear TTS; beyond it the voice rushes or overruns |
| Scene ids are kebab-case, prefixed `sNN-` | They become filenames (`src/scenes/<id>.tsx`, stills) |
| `libs` only lists libraries the scene actually needs, from video-stack | Every extra engine is bundle weight and a timing model to bridge |
| `ui` names real components (shadcn/Magic UI names or new PascalCase ones) | ui-asset-builder builds exactly this list |
| `compliance` set whenever the video mentions credit, rates, loans or savings | Triggers the disclaimer overlay and blocking QA rules |

`compliance` shape: `{"disclaimer": "<verbatim text supplied by the user>", "minSeconds": 5, "persistent": false}`.
The planner never writes disclaimer wording itself. If credit content has no user-supplied disclaimer,
it sets `"disclaimer": "MISSING"`, and the run stops at the approval gate.

Variants are deep-merged over `meta` only. Scene structure and timing stay identical across variants,
which is what makes batch rendering safe.
