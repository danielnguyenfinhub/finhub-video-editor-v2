---
name: render-qa
description: "Scaffolds the Remotion studio, renders the composition, masters audio/encodes with FFmpeg, and verifies the MP4 (resolution, fps, duration, codecs, loudness, true peak, black frames, silence, per-scene stills, text overflow, compliance wording). Use for any render, re-render, re-encode, platform resize (9:16, 1:1), batch variant render, or QA pass on a video. Not for writing scene code (remotion-motion) or narration (voice-captions)."
---

# Render and QA

## 1. Scaffold (first run only, when `studio/package.json` is missing)

```bash
npx --yes create-video@latest --yes --blank --tailwind studio   # --yes is required: without it the CLI waits on an interactive prompt
cd studio && npm i && npm i zod @remotion/zod-types @remotion/google-fonts @remotion/media-utils   # plus what the spec's libs need
```
The blank template registers `MyComp`; rename it to `Main` in `src/Root.tsx`.

Remotion downloads its own headless Chrome from `remotion.media` on first render. Where that host is blocked
(cloud sessions), add `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
(check the exact path with `find /opt/pw-browsers -name headless_shell`) to every `render`/`still`.
Pin every `remotion`/`@remotion/*` package to the **same exact version**. Mixed versions are the
commonest cause of a render crash that never appears in Studio. Before the first commercial render,
confirm the Remotion licence (see video-stack); if no licence is held, stop and report it.

## 2. Render and master

```bash
cd studio
npx remotion render Main ../out/raw.mp4 --props=../_workspace/01_planner_scenes.json --codec=h264 --concurrency=50%
ffmpeg -y -i ../out/raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-2:LRA=11" -ar 48000 -c:a aac -b:a 192k \
  -movflags +faststart ../out/<slug>_<WxH>.mp4
```
- **TP −2, not −1:** AAC encoding adds roughly 0.5–1 dB of overshoot. Mastering at −1.5 measured
  −0.89 dBTP after encoding in testing, which fails the −1.0 ceiling.
- −14 LUFS suits YouTube/Meta/LinkedIn. For broadcast, pass `--target-lufs -23` to the probe and master at `I=-23`.
- Other aspect ratios: render a separate composition (`Main-9x16`) from the same spec, not a crop, so
  text reflows inside the safe areas.
- Batch variants: loop over `spec.variants`, merging each into the props, and render to
  `out/<slug>_<variantId>.mp4`. Probe each output; one failed variant does not block the others.

## 3. Objective checks (script)

```bash
python3 .claude/skills/render-qa/scripts/probe.py out/<file>.mp4 \
  --spec _workspace/01_planner_scenes.json --stills _workspace/05_qa_stills
```
Exit code 1 means at least one check failed. The JSON names the check and the measured value. Black
frames or silence that the spec intends (a deliberate fade-to-black, a beat of silence) are acceptable
only when the spec's scene `notes` say so.

## 4. Visual review (look at every still)

Open each `_workspace/05_qa_stills/<sceneId>.png` with Read and check it against its scene in the spec:

| Check | Fail when |
| --- | --- |
| On-screen text | Wording differs from `onScreenText`, a word is clipped, or text sits outside the 5% safe margin |
| Legibility | Text under 40px at 1080p (scale for other heights), or low contrast over the background |
| UI realism | Placeholder text ("Lorem", "John Doe" unless scripted), broken icons, mismatched brand colours |
| Captions | Missing, more than two lines, or covering the key UI element of the scene |
| Brand | Colours/fonts differ from `meta.brand` |

Stills catch static defects only. For flicker or timing, render the suspect scene at full rate
(`--frames=<from>-<to>`) and inspect 5 consecutive frames.

## 5. Compliance (finance and credit content)

When `meta.compliance` is set, the verbatim disclaimer must appear for at least `minSeconds`, and no
scene may state a rate, saving or approval outcome that the spec does not source. Any rate shown needs a
comparison-rate statement (ASIC RG 234 / NCCP). QA reports violations as **blocking**. QA does not
rewrite regulated wording; it goes back to the planner and to human approval.

## Report format (`_workspace/05_qa_report.json`)

```json
{"pass": false, "probe": {"...": "probe.py output"},
 "findings": [{"severity": "blocking|major|minor", "sceneId": "s02", "check": "text_overflow",
               "evidence": "_workspace/05_qa_stills/s02.png: 'appointments' clipped at right edge",
               "owner": "motion-designer|ui-asset-builder|audio-engineer|render-engineer|video-planner",
               "fix": "one-line suggestion"}]}
```
`pass` is true only when the probe passes and there are no blocking or major findings.
