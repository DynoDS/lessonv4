"""Before and after page: the same worksheet specs, drawn by the engine before
and after the drawing fixes of 4 October 2026. No AI runs between the two."""
import json
import re
from pathlib import Path

ROUND2 = Path(__file__).resolve().parent.parent
AFTER = ROUND2 / "after-foot"
BEFORE = ROUND2 / "after"
NAMES = {"subtract": "Year 4 Maths", "renga": "Year 6 Writing", "divisibility": "Year 6 Maths",
         "leisure": "Year 4 History", "choices": "Year 4 PSHE"}
LEVELS = {"below": "Below", "expected": "Expected", "greaterDepth": "Greater Depth"}

changed = json.loads((AFTER / "changed.json").read_text(encoding="utf-8"))
rows, files = [], {}
for item in changed:
    name, page = item.split("/")
    key, run = name.rsplit("-", 1)
    record = json.loads((AFTER / "records" / f"{name}.json").read_text(encoding="utf-8"))
    level = next((LEVELS[k] for k, v in record["pages"]["levels"].items() if page in v), "Answer sheet")
    slips = any(page in record["pages"]["levels"].get(k, []) for k in record["pages"].get("slips", []))
    rid = re.sub(r"[^a-z0-9]+", "-", f"{name}-{page}".lower()).strip("-").replace("-jpg", "")
    before, after = f"before/{name}/{page}", f"after/{name}/{page}"
    files[before] = str(BEFORE / "page" / "img" / name / page).replace("\\", "/")
    files[after] = str(AFTER / "page" / "img" / name / page).replace("\\", "/")
    rows.append({"id": rid, "label": f"{NAMES[key]}, go {run.upper()}, {level}" + (" (slips)" if slips else ""),
                 "a": {"img": before, "what": "Before"}, "b": {"img": after, "what": "After"}})
template = (ROUND2 / "tools" / "lookfoot_template.html").read_text(encoding="utf-8")
out = ROUND2 / "look-foot"
out.mkdir(exist_ok=True)
(out / "clear-foot-test.html").write_text(
    template.replace("/*DATA*/", json.dumps(rows, ensure_ascii=False).replace("</", "<\/")), encoding="utf-8")
(ROUND2 / "lookfoot_files.json").write_text(json.dumps(files, indent=0), encoding="utf-8")
print(len(rows), "pairs")
