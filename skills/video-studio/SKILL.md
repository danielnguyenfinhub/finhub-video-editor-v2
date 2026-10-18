---
name: video-studio
description: "Orchestrates the FinHub Video-as-Code studio: brief → scene spec → UI assets + voiceover/captions → Remotion motion → render/master → QA fix loop → human approval. Use when asked to make, produce, edit, re-cut, re-render, resize, re-voice, batch or fix a programmatic/motion-graphics/explainer/product/promo video, or to re-run, update, revise or improve a previous video run, or to redo only one part of it (e.g. 'only re-voice', 'just fix scene 3', 'render the 9:16')."
---

# Video Studio Orchestrator

## Running in Cowork or as a plugin

When the `finhub-video-studio` connector tools are available (Cowork, or the plugin in any client),
run the pipeline steps through them instead of shell commands, because the studio files may not be
in the working folder:

| Step | Tool |
| --- | --- |
| Validate the spec (always first; free) | `check_spec` (pass `spec` inline or `specPath`); fix `problems`, and fix or justify `warnings` |
| Voice + word timings (spends credits) | `make_voiceover` |
| Stills approval (about 30 s; never skipped before a first render) | `preview_stills`, poll `get_job`, show the contact sheet, wait for the user's approval |
| Render, master, probe (2–3 min) | `build_video`, then poll `get_job` until `done`/`failed` |
| Show finished videos and their QA | `list_outputs` |

Report each `get_job`/`list_outputs` probe result as-is: "blocked: voice" failures are not passes.
Loaded as a plugin, the agent types are prefixed: `finhub-video-studio:video-planner`, and so on.
Use the prefixed name in `agentType`/`subagent_type` when the bare name is not found.

## Execution mode: mixed

| Phase | Mode | Why |
| --- | --- | --- |
| 0–1 Intake | main agent | Needs the user conversation |
| 2 Production | **Workflow** | Order, parallelism and the QA retry limit are fixed in code, so a run is repeatable and resumable |
| 2b Stills gate | main agent | The Workflow stops after Motion with a contact sheet; the human approves before render time is spent |
| 3 Approval | main agent | A human decision; never automated |

Invoking this skill counts as consent to run the Workflow below. Default size is 6–12 agent calls. If
the Workflow tool is unavailable, run the same phase order with the `Agent` tool (`subagent_type` = the
names below), launching UI and Audio in one message.

## Team

| Agent (`agentType`) | Model | Skill(s) | Writes |
| --- | --- | --- | --- |
| video-planner | opus | video-stack | `_workspace/01_planner_*` |
| ui-asset-builder | opus | remotion-motion, video-stack | `src/components/ui`, `_workspace/02_ui_manifest.md` |
| audio-engineer | sonnet | voice-captions | `public/voice*`, `words.json`, `_workspace/03_audio_report.md` |
| motion-designer | opus | remotion-motion | `src/app/Root.tsx`, `src/compositions/`, `_workspace/04_motion_notes.md` |
| render-engineer | sonnet | render-qa, video-stack | `pipelines/render.ts`, `out/*.mp4`, `data/outputs/`, `_workspace/05_render_log.md` |
| video-qa | opus | render-qa | QA report (returned; saved to `_workspace/05_qa_report.json`) |

Data contract: `references/scene-spec.md`. Every file handoff goes through `_workspace/` using
`{NN}_{agent}_{artifact}` names.

## Phase 0: what kind of run is this?

| State | Action |
| --- | --- |
| No `_workspace/` | Full run |
| `_workspace/` exists and the request is a partial fix ("only re-voice", "fix scene 3") | Run only the owning agent(s), then Render + QA. If `_workspace/run_meta.json` has a `runId`, prefer `resumeFromRunId` with the script edited for that phase |
| `_workspace/` exists and the brief is new | `mv _workspace _workspace_<YYYYMMDD-HHMM>`, then a full run |
| Resize / variants only | Render + QA phases only, with `args.variants` / aspect set and `args.stillsApproved: true` (the look is already approved) |

## Phase 1: intake (main agent)

Collect in one message at most 3 numbered questions, and only for things that cannot be defaulted:
product + CTA URL, length + aspect (default 60 s, 16:9), brand colours/font, and, for any credit or
rate content, **the verbatim disclaimer text**. Write the brief to `_workspace/00_input/brief.md`.

## Phase 2: production (Workflow)

Call `Workflow` with this script and `args: {brief: <brief text>, maxFixRounds: 2}`. Save the returned
`runId` to `_workspace/run_meta.json`. The first call stops at `stage: 'stills'`; see Phase 2b.

```javascript
export const meta = {
  name: 'video-studio-run',
  description: 'Plan, build, animate, render and QA a programmatic video',
  phases: [{ title: 'Plan' }, { title: 'Build' }, { title: 'Motion' }, { title: 'Stills' }, { title: 'Render+QA' }],
}

const STEP = { type: 'object', required: ['ok', 'summary'], properties: {
  ok: { type: 'boolean' }, summary: { type: 'string' }, blocked: { type: 'string' } } }
const PLAN = { type: 'object', required: ['ok', 'problems', 'openQuestions'], properties: {
  ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } },
  openQuestions: { type: 'array', items: { type: 'string' } } } }
const QA = { type: 'object', required: ['pass', 'findings'], properties: {
  pass: { type: 'boolean' },
  findings: { type: 'array', items: { type: 'object', required: ['severity', 'owner', 'evidence'], properties: {
    severity: { type: 'string', enum: ['blocking', 'major', 'minor'] }, sceneId: { type: 'string' },
    check: { type: 'string' }, evidence: { type: 'string' }, owner: { type: 'string' }, fix: { type: 'string' } } } } } }

const blocked = []
const note = (who, r) => { if (!r) blocked.push(`${who}: no result`); else if (r.blocked) blocked.push(`${who}: ${r.blocked}`) }

phase('Plan')   // planning and scaffolding are independent
const [plan, scaffold] = await parallel([
  () => agent(`Brief:\n${args.brief}\n\nWrite and validate the scene spec.`,
    { agentType: 'video-planner', phase: 'Plan', schema: PLAN }),
  () => agent('Run npm ci if node_modules is missing (render-qa section 1). Do not render.',
    { agentType: 'render-engineer', phase: 'Plan', schema: STEP }),
])
note('render-engineer(scaffold)', scaffold)
if (!plan) return { stage: 'plan', error: 'planner returned nothing', blocked }
const hardProblems = plan.problems.filter(p => !p.includes('MISSING'))
if (hardProblems.length) return { stage: 'plan', problems: hardProblems, openQuestions: plan.openQuestions, blocked }

phase('Build')  // UI and audio touch different files
const built = await parallel([
  () => agent('Build every UI component and asset in the spec.', { agentType: 'ui-asset-builder', phase: 'Build', schema: STEP }),
  () => agent('Produce voice, words.json and SFX for the spec.', { agentType: 'audio-engineer', phase: 'Build', schema: STEP }),
])
note('ui-asset-builder', built[0]); note('audio-engineer', built[1])

phase('Motion')
const motion = await agent('Write Root, the PromoVideo composition and every scene. Use provisional timing if words.json is missing.',
  { agentType: 'motion-designer', phase: 'Motion', schema: STEP })
note('motion-designer', motion)
if (!motion || !motion.ok) return { stage: 'motion', motion, blocked, openQuestions: plan.openQuestions }

if (!args.stillsApproved) {   // approval gate: no render time until a human has seen every scene
  phase('Stills')
  const stills = await agent('Render the stills contact sheet (npm run stills) for each requested composition. Do not render video. Return the sheet path(s) in summary.',
    { agentType: 'render-engineer', phase: 'Stills', schema: STEP })
  note('render-engineer(stills)', stills)
  return { stage: 'stills', stills, blocked, openQuestions: plan.openQuestions }
}

phase('Render+QA')
let qa = null, round = 0
const limit = args.maxFixRounds ?? 2
while (true) {
  const render = await agent(`Render, master and probe (round ${round}).`,
    { agentType: 'render-engineer', phase: 'Render+QA', schema: STEP })
  note(`render-engineer(r${round})`, render)
  qa = await agent(`Verify the latest out/*.mp4 (round ${round}). Return the QA report.`,
    { agentType: 'video-qa', phase: 'Render+QA', schema: QA, effort: 'high' })
  if (!qa) { blocked.push(`video-qa(r${round}): no result`); break }
  const toFix = qa.findings.filter(f => f.severity !== 'minor')
  if (qa.pass || !toFix.length || round >= limit) break
  if (toFix.some(f => f.owner === 'video-planner')) break   // structural change goes back to the human
  const owners = [...new Set(toFix.map(f => f.owner))]
    .filter(o => ['ui-asset-builder', 'audio-engineer', 'motion-designer', 'render-engineer'].includes(o))
  const fixed = (await parallel(owners.map(o => () =>
    agent(`Fix only these QA findings, then stop:\n${JSON.stringify(toFix.filter(f => f.owner === o))}`,
      { agentType: o, phase: 'Render+QA', schema: STEP })))).filter(Boolean)
  log(`round ${round}: ${toFix.length} findings → ${owners.join(', ')}; ${owners.length - fixed.length} fixers returned nothing`)
  round++
}
return { qa, rounds: round, blocked, openQuestions: plan.openQuestions }
```

## Phase 2b: stills approval (main agent; never skipped before a first render)

1. Show the contact sheet (`out/<slug>_<comp>_stills.jpg`; one tile per scene, in scene order, taken
   80% into each scene) and list the scene ids with their times from
   `out/stills/<slug>_<comp>/stills.json`. Add any `check_spec` warnings the planner kept.
2. Ask for approval or per-scene changes. Never treat silence or an unrelated reply as approval.
3. Approved: call `Workflow` again with the same script, `args.stillsApproved: true` and
   `resumeFromRunId` from `run_meta.json`; the earlier phases replay from cache and only Render+QA runs.
4. Changes requested: run only the owning agent(s) with the feedback (layout or motion →
   motion-designer, UI realism or brand → ui-asset-builder, script or structure → video-planner), then
   `npm run stills` again and repeat from step 1.

## Phase 3: human approval (main agent; never skipped)

1. Save `qa` to `_workspace/05_qa_report.json`. Present: the output path(s), the probe summary, all
   blocking/major findings still open, minor findings, the `blocked` list, and open questions.
2. Status wording: **Done** only if `qa.pass` and `blocked` is empty. Otherwise **Partial** or
   **Blocked**, naming what is missing.
3. Publishing, uploading (YouTube, Facebook, WordPress) or sending the video is outside this skill and
   needs Daniel's explicit confirmation in-session. Compliance-flagged videos also need his sign-off on
   the disclaimer.

## Error handling

| Situation | Action |
| --- | --- |
| An `agent()` returns null | Recorded in `blocked`; the phase continues where possible; reported at approval |
| Quota/auth failure (TTS, Whisper, npm) | Owners do not retry; motion uses provisional timing; reported as Blocked with the exact fix needed |
| Planner hard problems | Stop at Plan; show the problems; resume after the user answers |
| QA still failing after `maxFixRounds` | Stop; present the open findings, not a "best effort" claim of success |
| Findings owned by video-planner | Stop the loop; a script/structure change needs the human |
| Remotion licence not confirmed | render-engineer stops before the first commercial render; switch to HyperFrames or confirm the licence |

## Test scenarios

**Normal:** "Make the 60 s AI-receptionist salon ad, 16:9, pink accent, CTA example.com." Plan returns
no problems → UI ∥ Audio → Motion → stills sheet → Daniel approves → render → QA finds one clipped headline (major, motion-designer) →
fix round 1 → QA pass. Expected: `out/ai-receptionist-salon_1920x1080.mp4`, probe pass,
`_workspace/05_qa_report.json` `pass: true`, status Done after approval.

**Error:** "60 s refinance explainer showing 5.89% p.a." with no disclaimer supplied. The planner sets
`compliance.disclaimer: "MISSING"` and flags the rate as needing a comparison rate and a source. QA marks
both **blocking**, and the loop stops (owner video-planner). Status: Blocked, asking for the verbatim
disclaimer and the comparison rate source. Nothing is published.

**Partial re-run:** "Only re-voice with a male voice." Phase 0 → audio-engineer → motion-designer (re-sync
beats) → Render+QA. The planner and UI are not re-run.
