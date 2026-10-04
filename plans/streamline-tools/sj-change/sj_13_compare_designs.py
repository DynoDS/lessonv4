"""The subject-files release (topic 8, release 1): the saved designs before and
after, design by design (`validate-saved-designs.py` wrote both files).

    python -X utf8 plans/streamline-tools/sj-change/sj_13_compare_designs.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
before = json.loads((HERE / "sj-before-designs.json").read_text(encoding="utf-8"))
after = json.loads((HERE / "sj-final-designs.json").read_text(encoding="utf-8"))
print(f"designs: {len(before)} before, {len(after)} after")
assert set(before) == set(after), sorted(set(before) ^ set(after))
changed = [name for name in before if before[name] != after[name]]
print(f"pass before: {sum(r['ok'] for r in before.values())}; after: {sum(r['ok'] for r in after.values())}")
print("designs whose result changed:", changed or "none")
for name in changed:
    print(name)
    print("  before:", before[name]["faults"][:3])
    print("  after: ", after[name]["faults"][:3])
