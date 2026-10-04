"""Three widths of the same portrait sheets, side by side: as now (174mm of
working width), 144mm and 124mm. The same worksheet specs, no AI runs."""
import json
import re
from pathlib import Path

from PIL import Image

ROUND2 = Path(__file__).resolve().parent.parent
SETS = [("a", ROUND2 / "after", "As now"), ("b", ROUND2 / "narrow-15", "A bit narrower"), ("c", ROUND2 / "narrow-25", "Much narrower")]
NAMES = {"subtract": "Year 4 Maths", "renga": "Year 6 Writing", "divisibility": "Year 6 Maths",
         "leisure": "Year 4 History", "choices": "Year 4 PSHE"}
LEVELS = [("below", "Below"), ("expected", "Expected"), ("greaterDepth", "Greater Depth")]


def portrait(path: Path) -> bool:
    if not path.exists():
        return False
    with Image.open(path) as im:
        return im.height > im.width


files, data = {}, []
for key, tag in NAMES.items():
    rows, notes = [], {s: [] for s, _, _ in SETS}
    for run in "abc":
        name = f"{key}-{run}"
        records = {}
        for side, root, _ in SETS:
            p = root / "records" / f"{name}.json"
            records[side] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else None
            marker = (records[side] or {}).get("marker") or "no sheets could be built"
            if "FLAGGED" in marker or "no sheets" in marker:
                notes[side].append(f"Go {run.upper()}: {marker.replace('FIXED_RESOURCE_FLAGGED worksheets:', 'Expected stands in for').strip()}.")
        for level, label in LEVELS:
            row = {"id": f"{run}-{level}"}
            shown = 0
            for side, root, what in SETS:
                rec = records[side]
                pages = ((rec or {}).get("pages") or {}).get("levels", {}).get(level, [])
                slips = level in ((rec or {}).get("pages") or {}).get("slips", [])
                stood = level in ((rec or {}).get("pages") or {}).get("standIns", [])
                img = root / "page" / "img" / name / pages[0] if pages else None
                if img is None or slips or stood:
                    row[side] = None
                    continue
                rel = f"{side}/{name}/{pages[0]}"
                files[rel] = str(img).replace("\\", "/")
                turned = not portrait(img)
                row[side] = {"img": rel, "what": f"Go {run.upper()}, {label}", "flag": "Turned to landscape to fit" if turned else ""}
                shown += 1
            # Only rows where today's sheet is a portrait sheet: that is the question.
            if row["a"] and not row["a"]["flag"] and shown >= 2:
                rows.append(row)
    if rows:
        data.append({"id": key, "tag": tag, "label": tag, "ready": True, "lo": "",
                     "runs": {s: notes[s] or ["Every level was made."] for s, _, _ in SETS},
                     "bands": [{"label": "Portrait sheets at three widths", "note": "", "rows": rows}]})
        print(key, len(rows))

template = (ROUND2 / "tools" / "page_template.html").read_text(encoding="utf-8")
swaps = [
    (r"<title>.*?</title>", "<title>Narrower Portrait Sheets</title>"),
    (r"<h1>.*?</h1>", "<h1>The same portrait sheets at three widths</h1>"),
    (r'<div class="intro">[\s\S]*?</div>\s*\n\s*<div class="tabs"',
     '<div class="intro"><h1>The same portrait sheets at three widths</h1>'
     "<p>These are your round 2 sheets, drawn again with the whole working space narrower. Nothing was designed again.</p>"
     "<p>A is the width now (174mm). B is 144mm. C is 124mm. The page is still A4: only the working space changes.</p>"
     "<p>Where a narrower page could not hold a sheet, the engine turned it to landscape or could not make it, and the page says so.</p></div>\n\n  <div class=\"tabs\""),
    ('"How " + s.toUpperCase() + "\'s go went"', '({a: "A: as now", b: "B: a bit narrower", c: "C: much narrower"})[s]'),
    ("worksheet-three-runs-round-2", "narrower-portrait-sheets"),
    ('[["A", "A is best"], ["B", "B is best"], ["C", "C is best"], ["same", "All about the same"]]',
     '[["A", "A, as now"], ["B", "B, a bit narrower"], ["C", "C, much narrower"], ["same", "No real difference"]]'),
    ("Something is wrong on all three", "None of these is right"),
]
for old, new in swaps:
    if old.startswith("<") or old.startswith(r"<"):
        template, n = re.subn(old, lambda m: new, template, count=1)
    else:
        n = template.count(old)
        template = template.replace(old, new)
    assert n, old[:50]
out = ROUND2 / "narrow-page"
out.mkdir(exist_ok=True)
(out / "narrower-portrait-sheets.html").write_text(
    template.replace("/*DATA*/", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")), encoding="utf-8")
(ROUND2 / "narrow_files.json").write_text(json.dumps(files), encoding="utf-8")
print(len(files), "pictures")
