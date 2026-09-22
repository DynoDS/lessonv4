"""Run the design validator over every saved lesson design and record each result.

    python -X utf8 validate-saved-designs.py <validator.py> <out.json>

Each design is checked beside its own photo-requirements.json when one exists.
The output maps design path -> {"ok": bool, "faults": [first lines]} so a
before and after run can be compared design by design.
"""
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOTS = ["working", "lesson-resources-output/working", "output/working"]

validator, out = sys.argv[1], sys.argv[2]
results = {}
for root in ROOTS:
    for design in sorted((REPO / root).rglob("lesson-design.json")):
        photos = design.with_name("photo-requirements.json")
        args = [sys.executable, "-X", "utf8", validator, str(design)]
        if photos.exists():
            args.append(str(photos))
        proc = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
        text = (proc.stdout + proc.stderr).strip()
        ok = "LESSON_DESIGN_OK" in text
        faults = [line.strip() for line in text.splitlines() if line.strip() and "LESSON_DESIGN_OK" not in line]
        results[str(design.relative_to(REPO))] = {"ok": ok, "faults": faults[:40]}
Path(out).write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{sum(r['ok'] for r in results.values())} of {len(results)} pass")
