#!/usr/bin/env python3
"""Objective checks on a rendered MP4 against the scene spec.

  probe.py out/video.mp4 --spec _workspace/01_planner_scenes.json [--stills _workspace/05_qa_stills] [--target-lufs -14]

Prints {pass, checks:[{name, ok, detail}], stills:[...]} and exits 1 if any check fails.
Stills are taken at every scene midpoint so a reviewer can look at each scene without scrubbing.
"""
import argparse, json, os, re, subprocess, sys


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def ffprobe(path):
    r = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", path])
    if r.returncode:
        sys.exit(f"ffprobe failed: {r.stderr.strip()}")
    return json.loads(r.stdout)


def loudness(path):
    """Integrated LUFS and true peak via a loudnorm analysis pass."""
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
               "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"]).stderr
    d = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    return float(d["input_i"]), float(d["input_tp"])


def spans(path, flag, filt, start_key, end_key):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, flag, filt, "-f", "null", "-"]).stderr
    starts = [float(x) for x in re.findall(start_key + r":\s*([\d.]+)", err)]
    ends = [float(x) for x in re.findall(end_key + r":\s*([\d.]+)", err)]
    return [(round(s, 2), round(e, 2)) for s, e in zip(starts, ends)]


def check(path, spec, target_lufs, stills_dir):
    meta, scenes = spec["meta"], spec["scenes"]
    info = ffprobe(path)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    num, den = map(int, v["r_frame_rate"].split("/"))
    fps = num / den
    duration = float(info["format"]["duration"])
    expected = scenes[-1]["endSec"]
    checks = [
        ("resolution", (v["width"], v["height"]) == (meta["width"], meta["height"]),
         f'{v["width"]}x{v["height"]} vs {meta["width"]}x{meta["height"]}'),
        ("fps", abs(fps - meta["fps"]) < 0.01, f"{fps:.3f} vs {meta['fps']}"),
        ("duration", abs(duration - expected) <= 0.1, f"{duration:.2f}s vs {expected}s"),
        ("video_codec", v["codec_name"] == "h264" and v.get("pix_fmt") == "yuv420p",
         f'{v["codec_name"]}/{v.get("pix_fmt")} (h264/yuv420p plays everywhere)'),
        ("audio_codec", bool(a) and a["codec_name"] == "aac", a["codec_name"] if a else "no audio stream"),
    ]
    if a:
        lufs, tp = loudness(path)
        checks += [("loudness", abs(lufs - target_lufs) <= 1.5, f"{lufs} LUFS vs {target_lufs}±1.5"),
                   ("true_peak", tp <= -1.0, f"{tp} dBTP (max -1.0)")]
        silent = spans(path, "-af", "silencedetect=noise=-50dB:d=1.5", "silence_start", "silence_end")
        checks.append(("no_long_silence", not silent, f"silent spans {silent}" if silent else "none ≥1.5s"))
    black = spans(path, "-vf", "blackdetect=d=0.5:pix_th=0.10", "black_start", "black_end")
    checks.append(("no_black_frames", not black, f"black spans {black}" if black else "none ≥0.5s"))

    stills = []
    if stills_dir:
        os.makedirs(stills_dir, exist_ok=True)
        for sc in scenes:
            t = (sc["startSec"] + sc["endSec"]) / 2
            out = os.path.join(stills_dir, f'{sc["id"]}.png')
            run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", path, "-frames:v", "1", out])
            stills.append(out)
    result = [{"name": n, "ok": bool(ok), "detail": d} for n, ok, d in checks]
    return {"pass": all(c["ok"] for c in result), "checks": result, "stills": stills}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--spec", required=True)
    ap.add_argument("--stills"); ap.add_argument("--target-lufs", type=float, default=-14.0)
    a = ap.parse_args()
    report = check(a.video, json.load(open(a.spec)), a.target_lufs, a.stills)
    print(json.dumps(report, indent=1, ensure_ascii=False))
    sys.exit(0 if report["pass"] else 1)
