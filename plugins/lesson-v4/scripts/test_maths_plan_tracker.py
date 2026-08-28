#!/usr/bin/env python3
"""Self-contained tests for maths-plan-tracker.py. Run: python test_maths_plan_tracker.py
Exits 0 if all pass, 1 on the first failure."""
import json, os, subprocess, sys, tempfile
from docx import Document

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "maths-plan-tracker.py")

def run(*args):
    return subprocess.run([sys.executable, SCRIPT, *map(str, args)],
                          capture_output=True, text=True)

def build_test_docx(path):
    doc = Document()
    table = doc.add_table(rows=1, cols=7)
    header = table.rows[0].cells
    for cell, text in zip(header, ["Unit", "National Curriculum Statement", "Lesson Objective",
                                    "Description", "Things to Look For", "Key Questions", "Sentence Stems"]):
        cell.text = text

    def add_row(unit, nc, lo, desc, things, questions, stems):
        cells = table.add_row().cells
        cells[0].text = unit
        cells[1].text = nc
        cells[2].text = lo
        cells[3].text = desc
        cells[4].text = things
        cells[5].text = questions
        cells[6].text = stems

    add_row("Place Value: 3 weeks", "Count in steps of 10 and 100",
            "LO: Find 10 and 100 more/less", "Children revisit counting.",
            "May struggle crossing 100.", "What is 10 more?", "10 more than __ is __.")
    add_row("", "", "LO: Represent 4-digit numbers", "Building on earlier work.",
            "May forget zero as placeholder.", "What number is represented?", "")
    add_row("", "", "", "Assessment week, no new content.", "", "", "")
    add_row("Addition and Subtraction: 3 weeks", "Add and subtract numbers with up to 4 digits",
            "LO: Add two 4-digit numbers", "Column addition with exchange.",
            "May misalign columns.", "What do you do when a column totals more than 9?",
            "First I add the ones, then...")
    doc.save(path)

def test_extract_forward_fills_and_skips_gap_rows(tmp):
    docx_path = os.path.join(tmp, "plan.docx")
    build_test_docx(docx_path)
    out_path = os.path.join(tmp, "lessons.json")
    r = run("import", docx_path, out_path)
    assert r.returncode == 0, r.stderr
    with open(out_path) as f:
        lessons = json.load(f)
    assert len(lessons) == 3, lessons
    assert lessons[0]["index"] == 1
    assert lessons[0]["unit"] == "Place Value: 3 weeks"
    assert lessons[1]["unit"] == "Place Value: 3 weeks"
    assert lessons[1]["index"] == 2
    assert lessons[1]["lo"] == "Represent 4-digit numbers"
    assert "Sentence stems" not in lessons[1]["info"]
    assert lessons[2]["unit"] == "Addition and Subtraction: 3 weeks"
    assert lessons[2]["index"] == 3
    print("PASS extract_forward_fills_and_skips_gap_rows")

def test_next_builds_within_buffer(tmp):
    lessons = [{"index": i, "unit": "U", "lo": f"LO {i}", "info": f"info {i}"} for i in range(1, 6)]
    lessons_path = os.path.join(tmp, "lessons2.json")
    with open(lessons_path, "w") as f:
        json.dump(lessons, f)
    progress_path = os.path.join(tmp, "progress2.json")
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 0, "built_up_to": 0, "buffer": 4}, f)
    r = run("next", lessons_path, progress_path)
    assert r.returncode == 0, r.stderr
    # prior_context is empty for lesson 1: nothing sits behind the first lesson.
    assert json.loads(r.stdout) == {"status": "build", "index": 1, "unit": "U", "lo": "LO 1", "info": "info 1", "prior_context": ""}
    print("PASS next_builds_within_buffer")

def test_next_skips_when_buffer_full(tmp):
    lessons = [{"index": i, "unit": "U", "lo": f"LO {i}", "info": f"info {i}"} for i in range(1, 10)]
    lessons_path = os.path.join(tmp, "lessons3.json")
    with open(lessons_path, "w") as f:
        json.dump(lessons, f)
    progress_path = os.path.join(tmp, "progress3.json")
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 0, "built_up_to": 4, "buffer": 4}, f)
    r = run("next", lessons_path, progress_path)
    assert r.returncode == 0, r.stderr
    assert json.loads(r.stdout) == {"status": "skip", "reason": "buffer_full"}
    print("PASS next_skips_when_buffer_full")

def test_next_skips_when_plan_complete(tmp):
    lessons = [{"index": 1, "unit": "U", "lo": "LO 1", "info": "info 1"}]
    lessons_path = os.path.join(tmp, "lessons4.json")
    with open(lessons_path, "w") as f:
        json.dump(lessons, f)
    progress_path = os.path.join(tmp, "progress4.json")
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 1, "built_up_to": 1, "buffer": 4}, f)
    r = run("next", lessons_path, progress_path)
    assert r.returncode == 0, r.stderr
    assert json.loads(r.stdout) == {"status": "skip", "reason": "plan_complete"}
    print("PASS next_skips_when_plan_complete")

def test_advance_requires_sequential_index(tmp):
    progress_path = os.path.join(tmp, "progress5.json")
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 0, "built_up_to": 3, "buffer": 4}, f)

    r = run("advance", progress_path, 4)
    assert r.returncode == 0, r.stderr
    with open(progress_path) as f:
        assert json.load(f)["built_up_to"] == 4

    r_bad = run("advance", progress_path, 9)
    assert r_bad.returncode != 0
    with open(progress_path) as f:
        assert json.load(f)["built_up_to"] == 4
    print("PASS advance_requires_sequential_index")

def test_set_filed_advances_and_never_goes_backwards(tmp):
    lessons = [{"index": i, "unit": "U", "lo": f"LO {i}", "info": f"info {i}"} for i in range(1, 6)]
    lessons_path = os.path.join(tmp, "lessons6.json")
    with open(lessons_path, "w") as f:
        json.dump(lessons, f)
    progress_path = os.path.join(tmp, "progress6.json")
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 3, "built_up_to": 4, "buffer": 4}, f)

    # Advancing forward moves the counter.
    r = run("set-filed", progress_path, lessons_path, 4)
    assert r.returncode == 0, r.stderr
    with open(progress_path) as f:
        assert json.load(f)["filed_up_to"] == 4

    # A lower index must NOT move it backwards (idempotent max).
    r = run("set-filed", progress_path, lessons_path, 2)
    assert r.returncode == 0, r.stderr
    with open(progress_path) as f:
        assert json.load(f)["filed_up_to"] == 4

    # Out of range is rejected without writing.
    r_bad = run("set-filed", progress_path, lessons_path, 99)
    assert r_bad.returncode != 0
    with open(progress_path) as f:
        assert json.load(f)["filed_up_to"] == 4
    print("PASS set_filed_advances_and_never_goes_backwards")

def test_resync_updates_changed_fields(tmp):
    docx_path = os.path.join(tmp, "plan2.docx")
    build_test_docx(docx_path)
    lessons_path = os.path.join(tmp, "lessons7.json")
    run("import", docx_path, lessons_path)
    with open(lessons_path) as f:
        original = json.load(f)
    original[0]["lo"] = "Old wording nobody uses anymore"
    with open(lessons_path, "w") as f:
        json.dump(original, f)

    r = run("resync", docx_path, lessons_path)
    assert r.returncode == 0, r.stderr
    result = json.loads(r.stdout)
    assert result == {"status": "updated", "changed_count": 1}
    with open(lessons_path) as f:
        refreshed = json.load(f)
    assert refreshed[0]["lo"] == "Find 10 and 100 more/less"
    print("PASS resync_updates_changed_fields")

def test_resync_flags_structural_mismatch(tmp):
    docx_path = os.path.join(tmp, "plan3.docx")
    build_test_docx(docx_path)
    lessons_path = os.path.join(tmp, "lessons8.json")
    with open(lessons_path, "w") as f:
        json.dump([{"index": 1, "unit": "U", "lo": "only one lesson here", "info": "x"}], f)

    r = run("resync", docx_path, lessons_path)
    assert r.returncode != 0
    result = json.loads(r.stdout)
    assert result == {"status": "mismatch", "existing_count": 1, "new_count": 3}
    with open(lessons_path) as f:
        untouched = json.load(f)
    assert untouched == [{"index": 1, "unit": "U", "lo": "only one lesson here", "info": "x"}]
    print("PASS resync_flags_structural_mismatch")

def test_outbox_order_sorts_by_index_and_ignores_junk(tmp):
    outbox = os.path.join(tmp, "outbox")
    os.makedirs(os.path.join(outbox, "186 - Translate shapes"))
    os.makedirs(os.path.join(outbox, "185 - Complete a polygon"))
    os.makedirs(os.path.join(outbox, "_scratch"))            # not index-tagged: ignore
    with open(os.path.join(outbox, "README.txt"), "w") as f: # a file, not a folder: ignore
        f.write("x")
    r = run("outbox-order", outbox)
    assert r.returncode == 0, r.stderr
    lines = [l for l in r.stdout.splitlines() if l.strip()]
    assert lines == ["185\t185 - Complete a polygon", "186\t186 - Translate shapes"], lines
    print("PASS outbox_order_sorts_by_index_and_ignores_junk")

def test_outbox_order_empty_or_missing(tmp):
    missing = os.path.join(tmp, "no_such_outbox")
    r = run("outbox-order", missing)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "", repr(r.stdout)
    print("PASS outbox_order_empty_or_missing")

def test_next_includes_prior_unit_context(tmp):
    lessons = [
        {"index": 1, "unit": "Place Value", "lo": "Count in 10s", "info": "i1"},
        {"index": 2, "unit": "Place Value", "lo": "Round to 100", "info": "i2"},
        {"index": 3, "unit": "Fractions", "lo": "Tenths", "info": "i3"},
    ]
    lessons_path = os.path.join(tmp, "lessons3.json")
    with open(lessons_path, "w") as f:
        json.dump(lessons, f)
    progress_path = os.path.join(tmp, "progress3.json")
    # Mid-unit: next is lesson 2, so its prior context lists lesson 1 of the same unit.
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 0, "built_up_to": 1, "buffer": 4}, f)
    out = json.loads(run("next", lessons_path, progress_path).stdout)
    assert "Count in 10s" in out["prior_context"], out
    assert "Place Value" in out["prior_context"], out
    # Start of a new unit: next is lesson 3, prior context reaches back to the finished unit.
    with open(progress_path, "w") as f:
        json.dump({"filed_up_to": 0, "built_up_to": 2, "buffer": 4}, f)
    out = json.loads(run("next", lessons_path, progress_path).stdout)
    assert "opens a new unit" in out["prior_context"], out
    assert "Round to 100" in out["prior_context"], out
    print("PASS next_includes_prior_unit_context")


def main():
    with tempfile.TemporaryDirectory() as tmp:
        test_extract_forward_fills_and_skips_gap_rows(tmp)
        test_next_builds_within_buffer(tmp)
        test_next_includes_prior_unit_context(tmp)
        test_next_skips_when_buffer_full(tmp)
        test_next_skips_when_plan_complete(tmp)
        test_advance_requires_sequential_index(tmp)
        test_set_filed_advances_and_never_goes_backwards(tmp)
        test_resync_updates_changed_fields(tmp)
        test_resync_flags_structural_mismatch(tmp)
        test_outbox_order_sorts_by_index_and_ignores_junk(tmp)
        test_outbox_order_empty_or_missing(tmp)
    print("ALL PASS")

if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print(f"FAIL: {e}")
        sys.exit(1)
