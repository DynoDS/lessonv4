"""Build one lesson's three runs into page pictures and a plain record.

For each run: run the fixed worksheet build on what the worksheet designer
left (no repairs), turn every PDF page into a picture, sort the pages by level,
and note how the run went from its own Codex log.

Usage: finish_lesson.py <lesson-key>
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import fitz

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
EVAL = REPO / "evaluations" / "worksheet-designer-three-runs-2026-10-04"
PLUGIN = REPO / "plugins" / "lesson-v4"
LEVELS = [("below", "Below"), ("expected", "Expected"), ("greaterDepth", "Greater Depth")]
WIDTH = 1300


def render(pdf_path: Path, out_dir: Path, stem: str) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    names = []
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc, 1):
        long_side = max(page.rect.width, page.rect.height)
        pix = page.get_pixmap(matrix=fitz.Matrix(WIDTH / long_side, WIDTH / long_side), alpha=False)
        name = f"{stem}-{i:02d}.jpg"
        pix.pil_save(out_dir / name, format="JPEG", quality=80, optimize=True)
        names.append(name)
    return names


def run_notes(name: str) -> dict:
    log = EVAL / "logs" / f"{name}.jsonl"
    checks = []
    usage = {}
    final = ""
    if log.exists():
        for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
            try:
                event = json.loads(line)
            except ValueError:
                continue
            item = event.get("item") or {}
            if event.get("type") == "item.completed" and item.get("type") == "command_execution":
                if "check-worksheet.js" in (item.get("command") or ""):
                    out = item.get("aggregated_output") or ""
                    checks.append({
                        "passed": "WORKSHEET_PREFLIGHT_OK" in out,
                        "lines": [l for l in out.splitlines() if re.match(r"^[A-Z][A-Z_]{3,}[:\s]", l)][:12],
                    })
            if event.get("type") == "turn.completed":
                usage = event.get("usage") or {}
    final_path = EVAL / "logs" / f"{name}.final.txt"
    if final_path.exists():
        final = final_path.read_text(encoding="utf-8", errors="replace")
    start = EVAL / "logs" / f"{name}.start"
    end = EVAL / "logs" / f"{name}.end"
    minutes = None
    if start.exists() and end.exists():
        minutes = round((int(end.read_text().strip()) - int(start.read_text().strip())) / 60)
    return {
        "minutes": minutes,
        "checkRuns": len(checks),
        "firstCheckPassed": bool(checks) and checks[0]["passed"],
        "goesToPass": next((i + 1 for i, c in enumerate(checks) if c["passed"]), None),
        "lastCheckPassed": bool(checks) and checks[-1]["passed"],
        "checks": checks,
        "friction": [l.strip() for l in final.splitlines() if l.strip().lower().startswith("friction:")],
        "final": final,
        "usage": usage,
    }


def build(name: str, topic: str, last_resort: bool = False) -> dict:
    # A copy whose only change is one teacher note reworded, where the build refused
    # the run's own sheet over a millimetre figure in that note (see README).
    reworded = EVAL / "runs-note-reworded" / name
    working = reworded if reworded.exists() else EVAL / "runs" / name
    out = EVAL / "built" / name
    out.mkdir(parents=True, exist_ok=True)
    summary = working / "build-results" / "worksheets.json"
    proc = subprocess.run(
        [sys.executable, str(PLUGIN / "scripts" / "run-fixed-resource.py"), "worksheets",
         "--plugin-root", str(PLUGIN), "--working-dir", str(working), "--output-dir", str(out),
         "--lesson-name", topic, "--chrome-state", "ready", "--summary-output", str(summary)]
        + (["--omit-unfittable"] if last_resort else []),
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    result = {"noteReworded": reworded.exists(), "lastResort": last_resort, "ok": "FIXED_RESOURCE_OK" in proc.stdout, "marker": (proc.stdout.strip().splitlines() or [""])[-1]}
    if summary.exists():
        data = json.loads(summary.read_text(encoding="utf-8"))
        result["stdout"] = data.get("stdout", "")
        result["omitted"] = data.get("omittedSheets", [])
        result["standIns"] = data.get("standInSheets", [])
    else:
        result["stdout"] = proc.stdout + proc.stderr
    return result


def split_pages(name: str, topic: str, built: dict) -> dict:
    """Pages of the worksheet PDF, sorted by level. The PDF runs Below, Expected,
    Greater Depth; a level done in books prints its question slips in its place."""
    out = EVAL / "built" / name
    pages_dir = EVAL / "page" / "img" / name
    sheets_pdf = out / f"{topic} - Worksheets.pdf"
    answers_pdf = out / f"{topic} - Answers.pdf"
    result = {"levels": {}, "answers": [], "slips": []}
    if not sheets_pdf.exists():
        return result
    spec = json.loads((EVAL / "runs" / name / "worksheet.json").read_text(encoding="utf-8"))
    labels = dict(LEVELS)
    by_label = {v: k for k, v in LEVELS}
    stand_ins = [by_label[x["sheet"]] for x in built.get("standIns") or [] if x.get("sheet") in by_label]
    omitted = [by_label[x["sheet"]] for x in built.get("omitted") or [] if x.get("sheet") in by_label]
    present = [k for k, _ in LEVELS if (k in (spec.get("sheets") or {}) or k in stand_ins) and k not in omitted]
    result["standIns"] = stand_ins
    fit = {}
    m = re.search(r"Page fit:.*", built.get("stdout", ""))
    if m:
        for key in present:
            got = re.search(re.escape(labels[key]) + r": (\d+) page", m.group(0))
            if got:
                fit[key] = int(got.group(1))
    slip_levels = [k for k in present if (out / f"{topic} - Worksheets-slips-{k}.html").exists()]
    names = render(sheets_pdf, pages_dir, "sheet")
    counts = {k: (1 if k in slip_levels else fit.get(k, 1)) for k in present}
    spare = len(names) - sum(counts.values())
    if spare and slip_levels:
        counts[slip_levels[-1]] += spare
    elif spare and present:
        counts[present[-1]] += spare
    at = 0
    for key in present:
        result["levels"][key] = names[at:at + counts[key]]
        at += counts[key]
    result["slips"] = slip_levels
    result["pageCountMatches"] = spare == 0
    if answers_pdf.exists():
        result["answers"] = render(answers_pdf, pages_dir, "answers")
    return result


def main() -> None:
    key = sys.argv[1]
    record = {"key": key, "runs": {}}
    for run in ("a", "b", "c"):
        name = f"{key}-{run}"
        working = EVAL / "runs" / name
        notes = run_notes(name)
        entry = {"notes": notes, "hasSpec": (working / "worksheet.json").exists()}
        if entry["hasSpec"]:
            design = json.loads((working / "lesson-design.json").read_text(encoding="utf-8"))
            topic = re.sub(r'[<>:"/\\|?*]', "", (design.get("lesson") or {}).get("lo") or key)[:60].strip()
            topic = topic or key
            built = build(name, topic)
            if not (EVAL / "built" / name / f"{topic} - Worksheets.pdf").exists():
                # The plugin's own last resort, which a real run reaches once a sheet's
                # repair is spent: a level the page cannot hold gets the Expected sheet.
                first = built
                built = build(name, topic, last_resort=True)
                built["refusedFirst"] = [l for l in first.get("stdout", "").splitlines() if l.startswith("SHEET_DOES_NOT_FIT")][:3]
            entry["build"] = {k: v for k, v in built.items() if k != "stdout"}
            entry["buildLines"] = [l for l in built.get("stdout", "").splitlines()
                                   if re.match(r"^(AUTO_LAYOUT|RECORDING|SLIPS|SLIPS_SKIPPED|Page fit|Note|ANSWER_SHEET|[A-Z_]{4,}):", l)]
            entry["pages"] = split_pages(name, topic, built)
        record["runs"][run] = entry
        print(name, "spec" if entry["hasSpec"] else "NO SPEC",
              entry.get("build", {}).get("marker", ""),
              {k: len(v) for k, v in entry.get("pages", {}).get("levels", {}).items()},
              "answers", len(entry.get("pages", {}).get("answers", [])),
              "checks", notes["checkRuns"], "first", notes["firstCheckPassed"], "last", notes["lastCheckPassed"], notes["minutes"], "min")
    (EVAL / "records").mkdir(exist_ok=True)
    (EVAL / "records" / f"{key}.json").write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
