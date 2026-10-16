"""A lesson's wall is settled against the lesson before it, before any helper starts.

Lessons 28 to 32 (Year 4 column subtraction, 15 October 2026) each ran the
wall designer, and Thursday's and Friday's sheets came out the same. The
teacher's rulings: a repeated sheet is fine but making it again is wasted
work; a new sheet only when the method steps change; a day that changes them
adds to the earlier sheet, and in a set built side by side waits for it, never
for a lesson that has stopped. `working-wall-packet.py earlier` carries them.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "working-wall-packet.py"

STEPS = ["Line up the digits.", "Write the symbol.",
         "Start with the ((ones)).\nNot enough to take away? {{Exchange}} 1 from the next column to the left."]
MONDAY = ["Line up the digits.", "Write the symbol.", "Start with the ((ones))."]
WALL_CARD = {"type": "workedExample", "title": "Column subtraction", "items": []}


def design(steps: list[str] | None) -> dict:
    criteria = [{"id": "sc-001", "type": "steps", "content": {"steps": steps}}] if steps else []
    return {"lesson": {"subject": "Maths"}, "successCriteria": criteria}


def lesson_folder(root: Path, name: str, steps, wall: str | None = None, out: Path | None = None,
                  brief: str = "") -> Path:
    """A finished lesson folder. wall: None (no decision yet), "none" (no sheet) or "pdf"."""
    folder = root / name
    (folder / "build-results").mkdir(parents=True)
    (folder / "lesson-design.json").write_text(json.dumps(design(steps)), encoding="utf-8")
    (folder / "filing.txt").write_text("PREVIOUS_LESSON=NO_LESSON\n", encoding="utf-8")
    if brief:
        (folder / "teacher-brief.txt").write_text(brief, encoding="utf-8")
    if wall:
        make_wall(folder, wall, out or root)
    return folder


def make_wall(folder: Path, wall: str, out: Path) -> None:
    import hashlib

    cards = [] if wall == "none" else [WALL_CARD]
    (folder / "working-wall.json").write_text(json.dumps({"topic": folder.name, "cards": cards}), encoding="utf-8")
    outputs = []
    if cards:
        out.mkdir(parents=True, exist_ok=True)
        pdf = out / f"Working Wall - {folder.name}.pdf"
        pdf.write_bytes(b"%PDF " + folder.name.encode())
        outputs.append({"path": str(pdf), "sha256": hashlib.sha256(pdf.read_bytes()).hexdigest()})
    (folder / "build-results" / "wall.json").write_text(
        json.dumps({"schemaVersion": 1, "ok": True, "kind": "wall", "outputs": outputs}), encoding="utf-8")


def follows(folder: Path, previous: Path) -> None:
    (folder / "filing.txt").write_text(f"PREVIOUS_LESSON={previous}\n", encoding="utf-8")


def earlier(folder: Path, out: Path, *extra: str) -> tuple[str, dict]:
    env = {k: v for k, v in os.environ.items() if not k.startswith("LESSON_SET_")}
    done = subprocess.run(
        [sys.executable, "-X", "utf8", str(SCRIPT), "earlier", "--plugin-root", str(ROOT),
         "--working-dir", str(folder), "--output-dir", str(out), "--lesson-name", "Today", *extra],
        capture_output=True, text=True, encoding="utf-8", env=env)
    assert done.returncode == 0, done.stdout + done.stderr
    return done.stdout.strip(), json.loads((folder / "wall-earlier.json").read_text(encoding="utf-8"))


# ── one lesson at a time: the lesson before is finished ──────────────────

def test_same_steps_copies_the_earlier_sheet_and_no_designer_runs(tmp_path):
    out = tmp_path / "out"
    before = lesson_folder(tmp_path, "thursday", STEPS, "pdf", out)
    today = lesson_folder(tmp_path, "friday", STEPS)
    follows(today, before)
    line, record = earlier(today, out)
    assert line.startswith("WALL_REUSED")
    copied = out / "Working Wall - Today.pdf"
    assert copied.read_bytes() == (out / "Working Wall - thursday.pdf").read_bytes()
    built = json.loads((today / "build-results" / "wall.json").read_text(encoding="utf-8"))
    assert built["ok"] and built["outputs"][0]["path"] == str(copied)
    assert json.loads((today / "working-wall.json").read_text(encoding="utf-8"))["cards"] == [WALL_CARD]


def test_colour_marks_alone_do_not_make_the_steps_different(tmp_path):
    out = tmp_path / "out"
    before = lesson_folder(tmp_path, "thursday", [s.replace("((ones))", "ones") for s in STEPS], "pdf", out)
    today = lesson_folder(tmp_path, "friday", STEPS)
    follows(today, before)
    assert earlier(today, out)[0].startswith("WALL_REUSED")


def test_same_steps_after_a_lesson_that_chose_no_wall_gets_none(tmp_path):
    before = lesson_folder(tmp_path, "thursday", STEPS, "none")
    today = lesson_folder(tmp_path, "friday", STEPS)
    follows(today, before)
    line, _ = earlier(today, tmp_path / "out")
    assert line.startswith("WALL_NOT_NEEDED")
    assert json.loads((today / "working-wall.json").read_text(encoding="utf-8"))["cards"] == []
    assert not (tmp_path / "out").exists()


def test_no_wall_needs_no_build_record_to_count_as_decided(tmp_path):
    # The playbook builds nothing for an empty wall, so no build record exists.
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS})
    make_wall(days["tue"], "none", output)
    (days["tue"] / "build-results" / "wall.json").unlink()
    assert earlier(days["wed"], output)[0].startswith("WALL_NOT_NEEDED")


def test_a_new_step_designs_a_wall_that_adds_to_the_earlier_one(tmp_path):
    out = tmp_path / "out"
    before = lesson_folder(tmp_path, "monday", MONDAY, "pdf", out)
    today = lesson_folder(tmp_path, "tuesday", STEPS)
    follows(today, before)
    line, record = earlier(today, out)
    assert line.startswith("WALL_DESIGN") and record["buildsOn"]
    assert not (today / "working-wall.json").exists()
    view = subprocess.run(
        [sys.executable, "-X", "utf8", str(SCRIPT), "prepare", "--plugin-root", str(ROOT),
         "--working-dir", str(today), "--lesson-design", str(today / "lesson-design.json"),
         "--view-output", str(today / "v.md"), "--reference-output", str(today / "r.md"),
         "--receipt-output", str(today / "c.json")], capture_output=True, text=True, encoding="utf-8")
    assert "WORKING_WALL_PACKET_OK" in view.stdout, view.stdout + view.stderr
    text = (today / "v.md").read_text(encoding="utf-8")
    assert "## The wall before this one (monday)" in text and "keep its title" in text


def test_one_extra_smaller_point_is_a_change_of_steps(tmp_path):
    out = tmp_path / "out"
    before = lesson_folder(tmp_path, "wednesday", STEPS, "pdf", out)
    today = lesson_folder(tmp_path, "thursday", STEPS[:2] + [STEPS[2] + "\nCrossed out? Use the new digit."])
    follows(today, before)
    assert earlier(today, out)[0].startswith("WALL_DESIGN")


def test_a_lesson_without_steps_is_designed_as_before(tmp_path):
    out = tmp_path / "out"
    before = lesson_folder(tmp_path, "vikings-1", None, "pdf", out)
    today = lesson_folder(tmp_path, "vikings-2", None)
    follows(today, before)
    line, record = earlier(today, out)
    assert line.startswith("WALL_DESIGN") and not record["buildsOn"]
    assert not (out / "Working Wall - Today.pdf").exists()


def test_no_lesson_before_designs(tmp_path):
    today = lesson_folder(tmp_path, "first", STEPS)
    assert earlier(today, tmp_path / "out")[0].startswith("WALL_DESIGN")


# ── a set built side by side: the earlier day may still be working ───────

def make_set(tmp_path, days: dict[str, list[str]], status: dict[str, str] | None = None):
    output = tmp_path / "output"
    batch_dir = output / "working" / "lesson-batch"
    batch_dir.mkdir(parents=True)
    started = (datetime.now() - timedelta(minutes=30)).isoformat(timespec="seconds")
    lessons, folders = [], {}
    for key, steps in days.items():
        brief = f"Year 4 maths {key} column subtraction"
        folders[key] = lesson_folder(output / "working", f"y4-{key}", steps, brief=brief)
        lessons.append({"key": key, "tag": key, "brief": brief, "status": (status or {}).get(key, "building"),
                        "firstStarted": started})
    thread = batch_dir / "thread-y4-maths.json"
    thread.write_text(json.dumps({"lessons": [{"key": k, "methodSteps": s} for k, s in days.items()]}), encoding="utf-8")
    (batch_dir / "batch.json").write_text(json.dumps({"lessons": lessons}), encoding="utf-8")
    for key, folder in folders.items():
        (folder / "filing.txt").write_text(
            f"PREVIOUS_LESSON=NO_LESSON\nSET_THREAD={thread}\nSET_LESSON={key}\n", encoding="utf-8")
    return output, folders


def test_a_reusing_day_waits_while_the_day_it_copies_is_still_working(tmp_path):
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS, "thu": STEPS})
    line, record = earlier(days["thu"], output)
    # Wednesday makes no wall of its own, so Thursday copies from Tuesday.
    assert line.startswith("WALL_WAIT") and record["earlierLesson"] == "tue"
    assert record["firstWaited"] > 0
    make_wall(days["tue"], "pdf", output)
    assert earlier(days["thu"], output)[0].startswith("WALL_REUSED")


def test_a_day_that_adds_a_step_waits_for_the_wall_it_builds_on(tmp_path):
    output, days = make_set(tmp_path, {"mon": MONDAY, "tue": STEPS})
    assert earlier(days["tue"], output)[0].startswith("WALL_WAIT")
    make_wall(days["mon"], "pdf", output)
    line, record = earlier(days["tue"], output)
    assert line.startswith("WALL_DESIGN") and record["buildsOn"]


def test_never_waits_on_a_lesson_that_has_stopped(tmp_path):
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS}, {"tue": "stopped"})
    assert earlier(days["wed"], output)[0].startswith("WALL_DESIGN")


def test_a_wall_from_an_earlier_run_in_the_same_folder_is_not_taken(tmp_path):
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS})
    make_wall(days["tue"], "pdf", output)
    old = time.time() - 3 * 3600
    os.utime(days["tue"] / "build-results" / "wall.json", (old, old))
    assert earlier(days["wed"], output)[0].startswith("WALL_WAIT")


def test_gives_up_after_an_hour_and_makes_its_own(tmp_path):
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS})
    (days["wed"] / "wall-earlier.json").write_text(json.dumps({"firstWaited": time.time() - 61 * 60}), encoding="utf-8")
    assert earlier(days["wed"], output)[0].startswith("WALL_DESIGN")


def test_an_unrelated_earlier_day_is_never_waited_for(tmp_path):
    output, days = make_set(tmp_path, {"vikings": None, "fractions": STEPS})
    assert earlier(days["fractions"], output)[0].startswith("WALL_DESIGN")


def test_waiting_ends_as_soon_as_the_wall_arrives(tmp_path):
    output, days = make_set(tmp_path, {"tue": STEPS, "wed": STEPS})
    make_wall(days["tue"], "pdf", output)
    started = time.time()
    assert earlier(days["wed"], output, "--wait-minutes", "5")[0].startswith("WALL_REUSED")
    assert time.time() - started < 60
