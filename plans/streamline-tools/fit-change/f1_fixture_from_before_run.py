"""Step 1 of the fit release (4.2.289): the fixture the "keeps its size" test reads.

Run BEFORE any plugin change. It takes `scratch/fitb/lists-before.json` (every
real criteria list of the long-list investigation, and its six long lists in
the teacher's style, drawn in every shape by the 4.2.288 builder with
`scratch/fitb/lists.js`) and writes the size or refusal each got into a fixture
beside the builder's tests. The test then draws each list again in the same
shape and holds that every list that fitted keeps its size (and, in a practice
template, today's 4.60in panel).

    python -X utf8 plans/streamline-tools/fit-change/f1_fixture_from_before_run.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
BEFORE = HERE.parent / "scratch" / "fitb" / "lists-before.json"
OUT = HERE.parents[2] / "plugins" / "lesson-v4" / "builder" / "test" / "fixtures" / "criteria-lists-4.2.288.json"

rows = json.loads(BEFORE.read_text(encoding="utf-8"))
shapes = list(rows[0]["shapes"])
lists = []
for row in rows:
    text = json.dumps(row["steps"], ensure_ascii=False)
    assert "67" not in text, row["source"]
    assert list(row["shapes"]) == shapes
    # A number is the step size the list was drawn at; a string is the refusal.
    # Every practice template drew at its one width then, 4.60in.
    for shape, r in row["shapes"].items():
        assert "font" not in r or not shape.endswith("sc") and "sc-template" not in shape or r["w"] == 4.6, (shape, r)
    lists.append({
        "source": row["source"],
        "kind": row["kind"],
        "steps": row["steps"],
        "before": [r["font"] if "font" in r else r["err"] for r in row["shapes"].values()],
    })

assert not OUT.exists(), f"{OUT} already exists"
OUT.parent.mkdir(parents=True, exist_ok=True)
lines = [
    "{",
    ' "about": ' + json.dumps("Every real criteria list of the long-list investigation (23 September 2026) and its six long lists in the teacher's style, with the step size (a number) or the refusal (a name) each got from the 4.2.288 builder in each shape. Written by plans/streamline-tools/fit-change/f1_fixture_from_before_run.py.") + ",",
    ' "shapes": ' + json.dumps(shapes, ensure_ascii=False) + ",",
    ' "lists": [',
    ",\n".join("  " + json.dumps(item, ensure_ascii=False) for item in lists),
    " ]",
    "}",
]
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
json.loads(OUT.read_text(encoding="utf-8"))
print(f"{len(lists)} lists in {len(shapes)} shapes written to {OUT}")
