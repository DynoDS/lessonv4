"""Build the comparison page from the lesson records made by finish_lesson.py.

Writes page/worksheet-three-runs.html and page_files.json (published path ->
picture on disk). A lesson with no record yet shows as still being made.
"""
import json
from pathlib import Path

EVAL = Path(r"C:\Users\Daniel\Projects\lessonv4\evaluations\worksheet-designer-three-runs-2026-10-04")
LEVELS = [("below", "Below"), ("expected", "Expected"), ("greaterDepth", "Greater Depth")]
SIDES = ("a", "b", "c")
SHORT = {
    "subtract": "Year 4 Maths",
    "renga": "Year 6 Writing",
    "divisibility": "Year 6 Maths",
    "leisure": "Year 4 History",
    "choices": "Year 4 PSHE",
}


def run_lines(entry: dict) -> list[str]:
    notes = entry["notes"]
    lines = []
    if not entry["hasSpec"]:
        lines.append("It ended without making a worksheet.")
    elif notes["checkRuns"] == 0:
        lines.append("It never ran its own check.")
    elif notes["firstCheckPassed"]:
        lines.append("Passed its own check first time.")
    elif notes.get("goesToPass"):
        lines.append(f"Passed its own check on go {notes['goesToPass']}.")
    else:
        lines.append(f"Ended without passing its own check ({notes['checkRuns']} goes).")
    if notes.get("minutes") is not None:
        lines.append(f"Took about {notes['minutes']} minutes.")
    build = entry.get("build")
    if build is not None:
        if build.get("noteReworded"):
            lines.append("The build refused its sheets because its note to you quoted a measurement in millimetres with a 6 next to a 7 in it. I reworded that one note in a copy so you can see the sheets. Nothing a child reads was changed.")
        if build.get("lastResort"):
            lines.append("The sheets would not build as it left them, because a sheet did not fit its page. What you see is the plugin's last resort, where the Expected sheet stands in for the level that would not fit.")
        if not build.get("ok") and not build.get("standIns") and not build.get("omitted"):
            lines.append("The sheets would not build from what it left.")
        for item in build.get("standIns") or []:
            lines.append(f"No {item.get('sheet')} sheet of its own: the Expected sheet stands in.")
        for item in build.get("omitted") or []:
            lines.append(f"The {item.get('sheet')} sheet was left out: it would not fit a page.")
    for line in entry.get("buildLines", []):
        if line.startswith("Note:"):
            lines.append("Its note to you: " + line[5:].strip())
    for line in notes.get("friction", []):
        lines.append(line)
    return lines


def main() -> None:
    lessons = json.loads((EVAL / "lessons.json").read_text(encoding="utf-8"))
    files = {}
    data = []
    for lesson in lessons:
        key = lesson["key"]
        record_path = EVAL / "records" / f"{key}.json"
        item = {"id": key, "tag": SHORT[key], "label": lesson["label"], "ready": record_path.exists()}
        if not item["ready"]:
            data.append(item)
            continue
        record = json.loads(record_path.read_text(encoding="utf-8"))
        design = json.loads((EVAL / "runs" / f"{key}-a" / "lesson-design.json").read_text(encoding="utf-8"))
        item["lo"] = (design.get("lesson") or {}).get("lo", "")
        item["runs"] = {s: run_lines(record["runs"][s]) for s in SIDES}

        def page(side: str, name: str, what: str, flag: str = "") -> dict:
            rel = f"img/{key}-{side}/{name}"
            files[rel] = str(EVAL / "page" / rel).replace("\\", "/")
            return {"img": rel, "what": what, "flag": flag}

        bands = []
        for level, label in LEVELS + [("answers", "Answer sheet")]:
            per_side = {}
            for s in SIDES:
                pages = record["runs"][s].get("pages") or {}
                names = pages.get("answers", []) if level == "answers" else (pages.get("levels") or {}).get(level, [])
                slips = "Question slips for books" if level in (pages.get("slips") or []) else ""
                if level in (pages.get("standIns") or []):
                    slips = "This is the Expected sheet standing in"
                per_side[s] = [(n, slips) for n in names]
            depth = max(len(v) for v in per_side.values())
            if depth == 0:
                if level != "answers":
                    item["lo"] += f" (No separate {label} sheet in any of the three: the adaptation gives that group another level's sheet.)"
                continue
            rows = []
            for i in range(depth):
                row = {"id": f"{level}-{i + 1}"}
                for s in SIDES:
                    if i < len(per_side[s]):
                        name, slips = per_side[s][i]
                        what = label + (f", page {i + 1}" if len(per_side[s]) > 1 else "")
                        row[s] = page(s, name, what, slips)
                    else:
                        row[s] = None
                rows.append(row)
            bands.append({"label": label, "note": "for the teacher" if level == "answers" else "", "rows": rows})
        item["bands"] = bands
        data.append(item)
        print(key, {b["label"]: len(b["rows"]) for b in bands})
    template = (EVAL / "tools" / "page_template.html").read_text(encoding="utf-8")
    out = template.replace("/*DATA*/", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    (EVAL / "page").mkdir(exist_ok=True)
    (EVAL / "page" / "worksheet-three-runs.html").write_text(out, encoding="utf-8")
    (EVAL / "page_files.json").write_text(json.dumps(files, indent=0), encoding="utf-8")
    total = sum(Path(p).stat().st_size for p in files.values())
    print("pictures", len(files), "bytes", total)


if __name__ == "__main__":
    main()
