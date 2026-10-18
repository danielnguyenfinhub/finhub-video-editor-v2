#!/usr/bin/env python3
"""Validate a scene spec against the rules in references/scene-spec.md.

  check_spec.py _workspace/01_planner_scenes.json     # prints problems, exit 1 if any
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
        print("selftest ok"); sys.exit(0)
    found = problems(json.load(open(sys.argv[1])))
    print("\n".join(found) or "spec ok")
    sys.exit(1 if found else 0)
