#!/usr/bin/env python3
"""Validate a scene spec against the rules in references/scene-spec.md.

  check_spec.py _workspace/01_planner_scenes.json     # prints problems (exit 1) and warnings (exit 0)
  check_spec.py --selftest
"""
import json, re, sys

CREDIT = re.compile(r"\b(loan|loans|rate|rates|interest|mortgage|credit|refinanc\w*|borrow\w*|repayment\w*|saving\w*)\b", re.I)


def problems(spec):
    out, meta, scenes = [], spec.get("meta", {}), spec.get("scenes", [])
    for k in ("fps", "width", "height", "slug"):
        if k not in meta:
            out.append(f"meta.{k} missing")
    if not scenes:
        return out + ["no scenes"]
    if scenes[0]["startSec"] != 0:
        out.append(f"{scenes[0]['id']}: first scene must start at 0")
    for a, b in zip(scenes, scenes[1:]):
        if a["endSec"] != b["startSec"]:
            out.append(f"{a['id']}→{b['id']}: gap/overlap ({a['endSec']} vs {b['startSec']})")
    seen = set()
    for s in scenes:
        sid, dur = s.get("id", "?"), s["endSec"] - s["startSec"]
        if not re.fullmatch(r"s\d{2}-[a-z0-9-]+", sid):
            out.append(f"{sid}: id must be sNN-kebab-case")
        if sid in seen:
            out.append(f"{sid}: duplicate id")
        seen.add(sid)
        if dur <= 0:
            out.append(f"{sid}: non-positive duration")
        words = len(s.get("voiceover", "").split())
        if words > 2.5 * dur:
            out.append(f"{sid}: {words} words in {dur}s exceeds 2.5 words/s (max {int(2.5 * dur)})")
    text = " ".join(s.get("voiceover", "") + " " + " ".join(s.get("onScreenText", [])) for s in scenes)
    comp = meta.get("compliance")
    if CREDIT.search(text) and not comp:
        out.append("credit/rate language found but meta.compliance is not set")
    if comp and comp.get("disclaimer", "MISSING") == "MISSING":
        out.append("compliance.disclaimer is MISSING: needs verbatim wording from the user")
    return out


# Filler that makes a scene decorate instead of say something (idea from OpenMontage's variation check).
FILLER = re.compile(r"\b(cutting-edge|state-of-the-art|next-generation|revolutionary|seamless(ly)?|game-chang\w*|innovative|stunning|breathtaking|in today's world)\b", re.I)


def warnings(spec):
    """Slideshow risks: worth fixing before credits are spent, but not blockers."""
    out, scenes = [], spec.get("scenes", [])
    for a, b in zip(scenes, scenes[1:]):
        if a.get("ui") and a.get("ui") == b.get("ui"):
            out.append(f"{a['id']}→{b['id']}: same UI {a['ui']} twice in a row reads as a slideshow")
    for s in scenes:
        sid, dur = s.get("id", "?"), s["endSec"] - s["startSec"]
        if not s.get("motion", "").strip():
            out.append(f"{sid}: no motion intent; say what moves and on which word")
        words = sum(len(t.split()) for t in s.get("onScreenText", []))
        if dur > 0 and words > 1.5 * dur:
            out.append(f"{sid}: {words} on-screen words in {dur}s is text-first; move words to the voiceover")
        for m in FILLER.finditer(s.get("voiceover", "") + " " + " ".join(s.get("onScreenText", []))):
            out.append(f"{sid}: filler word '{m.group(0)}'; replace with a concrete claim")
    return out


if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        good = {"meta": {"fps": 30, "width": 1920, "height": 1080, "slug": "x"},
                "scenes": [{"id": "s01-a", "startSec": 0, "endSec": 4, "voiceover": "one two three"},
                           {"id": "s02-b", "startSec": 4, "endSec": 6, "voiceover": "four"}]}
        assert problems(good) == [], problems(good)
        bad = json.loads(json.dumps(good))
        bad["scenes"][1]["startSec"] = 5
        bad["scenes"][1]["voiceover"] = "Low home loan rates now available today"
        p = problems(bad)
        assert any("gap" in x for x in p) and any("words" in x for x in p) and any("compliance" in x for x in p), p
        assert len(warnings(good)) == 2, warnings(good)  # neither scene has motion intent
        bad["scenes"][0].update(ui=["Card"], motion="slides in")
        bad["scenes"][1].update(ui=["Card"], motion="x", onScreenText=["A seamless revolutionary app"])
        w = warnings(bad)
        assert any("same UI" in x for x in w) and sum("filler" in x for x in w) == 2 and any("text-first" in x for x in w), w
        print("selftest ok"); sys.exit(0)
    spec = json.load(open(sys.argv[1]))
    found = problems(spec)
    print("\n".join(found + ["warn: " + w for w in warnings(spec)]) or "spec ok")
    sys.exit(1 if found else 0)
