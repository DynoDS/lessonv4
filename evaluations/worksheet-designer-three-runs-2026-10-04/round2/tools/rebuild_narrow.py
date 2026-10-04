"""Rebuild round 2's fifteen worksheet specs with the engine as it now stands.

No AI runs: the same worksheet.json files, drawn again, so a before and after
shows only what the engine changed. Writes after/ beside round 2 and a list of
the pages that differ.
"""
import importlib.util
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROUND2 = Path(__file__).resolve().parent.parent
import os
EXTRA = sys.argv[1]
os.environ["WORKSHEET_PORTRAIT_SIDE_EXTRA_MM"] = EXTRA
AFTER = ROUND2 / f"narrow-{EXTRA}"

spec = importlib.util.spec_from_file_location("finish_lesson", ROUND2 / "tools" / "finish_lesson.py")
fin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fin)
fin.EVAL = AFTER

LESSONS = ["subtract", "renga", "divisibility", "leisure", "choices"]


def differs(a: Path, b: Path) -> bool:
    if not a.exists() or not b.exists():
        return True
    ia, ib = Image.open(a).convert("L"), Image.open(b).convert("L")
    if ia.size != ib.size:
        return True
    box = ImageChops.difference(ia, ib).point(lambda v: 255 if v > 40 else 0).getbbox()
    return box is not None


def main() -> None:
    only = set(sys.argv[2:])
    changed = []
    for key in LESSONS:
        if only and key not in only:
            continue
        for run in "abc":
            name = f"{key}-{run}"
            src = ROUND2 / "runs" / name
            dst = AFTER / "runs" / name
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns("build-results", "output"))
            design = json.loads((dst / "lesson-design.json").read_text(encoding="utf-8"))
            topic = re.sub(r'[<>:"/\\|?*]', "", (design.get("lesson") or {}).get("lo") or key)[:60].strip() or key
            built = fin.build(name, topic)
            if not (AFTER / "built" / name / f"{topic} - Worksheets.pdf").exists():
                built = fin.build(name, topic, last_resort=True)
            pages = fin.split_pages(name, topic, built)
            record = {"marker": built.get("marker"), "pages": pages}
            (AFTER / "records").mkdir(parents=True, exist_ok=True)
            (AFTER / "records" / f"{name}.json").write_text(json.dumps(record, indent=1), encoding="utf-8")
            names = [n for group in pages.get("levels", {}).values() for n in group] + pages.get("answers", [])
            for page in names:
                before = ROUND2 / "after" / "page" / "img" / name / page
                after = AFTER / "page" / "img" / name / page
                if differs(before, after):
                    changed.append(f"{name}/{page}")
            print(name, built.get("marker"), [l for l in built.get("stdout","").splitlines() if l.startswith("AUTO_LAYOUT")])
    (AFTER / "changed.json").write_text(json.dumps(changed, indent=1), encoding="utf-8")
    print("pages that changed:", len(changed))


if __name__ == "__main__":
    main()
