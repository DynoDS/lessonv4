"""Release 7A (4.2.293): the saved designs, before and after, with the change
plan's normaliser ("Before any release": the saved-design comparison needs a
normaliser in 7A).

Taking `starter.content.testQuestionPath` and `lesson.scope`,
`lesson.deferredLearning` and `lesson.lesson2Direction` out of the contract
makes every saved design that carries them fail the new validator on unknown
fields. So each saved design is checked twice (the standard run of
`validate-saved-designs.py` writes `7a-after-designs.json`; this one writes
`7a-after-stripped-designs.json`) on the current validator:

- stripped of those four keys (a copy in `scratch/7ab/stripped/`), which is the
  real comparison: its first fault must be the one the same design gave on
  4.2.292 (`7a-before-designs.json`), design by design;
- as saved, which must fail, and only on those keys: its first fault names an
  unknown field that is one of the four.

A new lesson never carries the keys. A lesson already running when 4.2.293 is
installed, or stopped and picked up after it, has its design checked again at
the adaptation picture step and at any later review, and is refused there (the
first check's finding), so 4.2.293 is installed only between lessons.

    python -X utf8 a13_compare_designs.py
"""
import copy
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
TOOLS = REPO / "plans" / "streamline-tools"
VALIDATOR = REPO / "plugins" / "lesson-v4" / "scripts" / "validate-lesson-design.py"
BEFORE = TOOLS / "7a-before-designs.json"
AFTER = TOOLS / "7a-after-stripped-designs.json"
SCRATCH = TOOLS / "scratch" / "7ab" / "stripped"
RETIRED_LESSON = ("scope", "deferredLearning", "lesson2Direction")
RETIRED_STARTER = ("testQuestionPath",)


def run(design: Path) -> list[str]:
    photos = design.with_name("photo-requirements.json")
    args = [sys.executable, "-X", "utf8", str(VALIDATOR), str(design)]
    if photos.exists():
        args.append(str(photos))
    proc = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    text = (proc.stdout + proc.stderr).strip()
    if "LESSON_DESIGN_OK" in text:
        return []
    return [line.strip() for line in text.splitlines() if line.strip()][:40]


def strip(design: dict) -> tuple[dict, list[str]]:
    out = copy.deepcopy(design)
    removed = []
    lesson = out.get("lesson") if isinstance(out.get("lesson"), dict) else {}
    for key in RETIRED_LESSON:
        if key in lesson:
            del lesson[key]
            removed.append(f"lesson.{key}")
    starter = out.get("starter") if isinstance(out.get("starter"), dict) else {}
    content = starter.get("content") if isinstance(starter.get("content"), dict) else {}
    for key in RETIRED_STARTER:
        if key in content:
            del content[key]
            removed.append(f"starter.content.{key}")
    return out, removed


before = json.loads(BEFORE.read_text(encoding="utf-8"))
if SCRATCH.exists():
    shutil.rmtree(SCRATCH)
after = {}
report = []
on_keys, earlier = [], []
same = changed = 0
for n, (rel, was) in enumerate(sorted(before.items())):
    path = REPO / rel
    design = json.loads(path.read_text(encoding="utf-8"))
    stripped, removed = strip(design)
    folder = SCRATCH / f"{n:02d}"
    folder.mkdir(parents=True)
    copy_path = folder / "lesson-design.json"
    copy_path.write_text(json.dumps(stripped, ensure_ascii=False, indent=2), encoding="utf-8")
    photos = path.with_name("photo-requirements.json")
    if photos.exists():
        shutil.copy(photos, folder / "photo-requirements.json")
    faults = run(copy_path)
    unstripped = run(path)
    after[rel] = {"ok": not faults, "faults": faults, "removed": removed, "asSaved": unstripped[:3]}
    first_before = was["faults"][0] if was["faults"] else "OK"
    first_after = faults[0] if faults else "OK"
    if first_before == first_after and was["ok"] == (not faults):
        same += 1
    else:
        changed += 1
        report.append(f"CHANGED {rel}\n  before: {first_before[:200]}\n  after:  {first_after[:200]}")
    # As saved, the design fails either on the retired keys alone (the
    # contract's unknown-fields refusal naming only them) or, where a check
    # that reads the whole file runs before the contract (an em dash, a 67, a
    # scaffold placeholder, a batch of several faults), on exactly the fault it
    # gave on 4.2.292, so the keys change nothing there.
    if removed:
        head = unstripped[0] if unstripped else "OK"
        unknown = head.split("unknown fields:")[-1].split(",") if "unknown fields:" in head else []
        unknown = [u.strip() for u in unknown if u.strip()]
        if unknown and all(u in RETIRED_LESSON + RETIRED_STARTER for u in unknown):
            on_keys.append(rel)
        elif head == first_before:
            earlier.append(rel)
        else:
            report.append(f"AS SAVED, NOT ONLY THE RETIRED KEYS {rel}: {head[:200]}")
    elif unstripped[:1] != faults[:1]:
        report.append(f"NO RETIRED KEYS BUT DIFFERENT {rel}: {unstripped[:1]} / {faults[:1]}")

AFTER.write_text(json.dumps(after, indent=1, ensure_ascii=False), encoding="utf-8")
print("\n".join(report) or "no design changed its first fault")
print(f"{same} of {len(before)} give the same first fault stripped as on 4.2.292; {changed} differ")
print(f"as saved: {len(on_keys)} refused on the retired keys alone; {len(earlier)} refused first by a check "
      f"that runs before the contract, exactly as on 4.2.292")
print(f"{sum(1 for v in after.values() if v['removed'])} carried a retired key as saved; "
      f"{sum(1 for v in after.values() if v['ok'])} pass stripped")
