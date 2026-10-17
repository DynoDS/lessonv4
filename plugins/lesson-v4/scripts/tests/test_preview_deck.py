"""The decorator's warm-up runs as one command: check, probe, render, overview,
measure, in that order, skipping none, and stopping only where the steps it
replaced would have stopped (17 October 2026)."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "preview-deck.py"


def load():
    spec = importlib.util.spec_from_file_location("preview_deck", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fake(module, monkeypatch, codes):
    """Replace each step with a recorder returning the exit code named for it."""
    calls = []

    def run(command):
        script = Path(command[1]).name
        if script == "check-slide-design.js":
            step = "check"
        elif "--probe-route" in command:
            step = "probe"
        elif script == "render-pages.py":
            step = "render"
        elif script == "build-visual-consistency-overview.py":
            step = "overview"
        elif script == "check-optional-pictures.py":
            step = "pictures"
        else:
            step = "measure"
        calls.append((step, command))
        lines = []
        if step == "check" and codes.get("check", 0) == 0:
            lines = ["SLIDE_DESIGN_PREVIEW_DIR: /p", "SLIDE_DESIGN_PREVIEW: /p/deck.pptx",
                     "SLIDE_DESIGN_CHECK_OK: 3 slides"]
        return codes.get(step, 0), lines

    monkeypatch.setattr(module, "run", run)
    monkeypatch.setattr(module.shutil, "which", lambda name: "node")
    return calls


def args(tmp_path, *extra):
    """The decorator's warm-up."""
    lesson = tmp_path / "lesson.json"
    lesson.write_text(json.dumps({"slides": []}), encoding="utf-8")
    return ["--settled", "--copy-from", str(lesson),
            "--candidate", str(tmp_path / "lesson.json.tmp.a1"),
            "--photo-requirements", str(tmp_path / "photos.json"),
            "--room-output", str(tmp_path / "slide-room.json"), *extra]


def bare(tmp_path, *extra):
    """The decorator's re-check (with --settled) and the slide designer (without)."""
    candidate = tmp_path / "lesson.json.tmp.a1"
    candidate.write_text(json.dumps({"slides": [], "decorated": True}), encoding="utf-8")
    return ["--candidate", str(candidate),
            "--photo-requirements", str(tmp_path / "photos.json"), *extra]


def test_every_step_runs_in_order_and_the_candidate_is_a_copy(tmp_path, monkeypatch, capsys):
    module = load()
    calls = fake(module, monkeypatch, {})
    assert module.main(args(tmp_path)) == 0
    assert [step for step, _ in calls] == ["check", "probe", "render", "overview", "measure"]
    check = calls[0][1]
    assert check[2:4] == ["--preview", "--settled"]
    assert check[-1].endswith("lesson.json.tmp.a1")
    assert "--flagged-slides" not in check
    # The room is measured against the canonical lesson, as the designer does.
    measure = calls[-1][1]
    assert measure[measure.index("--lesson") + 1] == str(tmp_path / "lesson.json")
    assert (tmp_path / "lesson.json.tmp.a1").read_text() == (tmp_path / "lesson.json").read_text()
    assert capsys.readouterr().out.strip().splitlines()[-1].startswith("DECK_PREVIEW_DONE:")


def test_flagged_slides_reach_the_check(tmp_path, monkeypatch):
    module = load()
    calls = fake(module, monkeypatch, {})
    module.main(args(tmp_path, "--flagged-slides", "4,7"))
    check = calls[0][1]
    assert check[check.index("--flagged-slides") + 1] == "4,7"


@pytest.mark.parametrize("step, code, ran", [
    ("check", 1, ["check"]),
    ("probe", 3, ["check", "probe"]),
    ("render", 1, ["check", "probe", "render"]),
])
def test_a_failure_stops_there(tmp_path, monkeypatch, capsys, step, code, ran):
    module = load()
    calls = fake(module, monkeypatch, {step: code})
    assert module.main(args(tmp_path)) == code
    assert [s for s, _ in calls] == ran
    assert capsys.readouterr().out.strip().splitlines()[-1].startswith("DECK_PREVIEW_STOPPED:")


def test_no_render_route_is_not_a_failure(tmp_path, monkeypatch, capsys):
    module = load()
    calls = fake(module, monkeypatch, {"render": 2})
    assert module.main(args(tmp_path)) == 0
    assert [s for s, _ in calls] == ["check", "probe", "render"]
    last = capsys.readouterr().out.strip().splitlines()[-1]
    assert last.startswith("DECK_PREVIEW_DONE:") and "VISUAL_ROUTE_UNVERIFIED" in last


def test_a_failed_overview_still_measures(tmp_path, monkeypatch, capsys):
    module = load()
    calls = fake(module, monkeypatch, {"overview": 2})
    assert module.main(args(tmp_path)) == 0
    assert [s for s, _ in calls][-1] == "measure"
    assert "overview failed" in capsys.readouterr().out


def test_the_designer_check_is_not_settled_and_measures_nothing(tmp_path, monkeypatch, capsys):
    module = load()
    calls = fake(module, monkeypatch, {})
    assert module.main(bare(tmp_path)) == 0
    assert [s for s, _ in calls] == ["check", "probe", "render", "overview"]
    assert "--settled" not in calls[0][1]
    assert capsys.readouterr().out.strip().splitlines()[-1] == (
        "DECK_PREVIEW_DONE: check passed; pages drawn; overview built.")


def test_a_refused_designer_check_draws_nothing(tmp_path, monkeypatch):
    module = load()
    calls = fake(module, monkeypatch, {"check": 1})
    assert module.main(bare(tmp_path)) == 1
    assert [s for s, _ in calls] == ["check"]


def test_the_decorator_recheck_keeps_its_drawings(tmp_path, monkeypatch):
    """Without --copy-from the candidate is never overwritten, so the drawings
    just placed are the ones checked and drawn."""
    module = load()
    calls = fake(module, monkeypatch, {})
    before = (tmp_path / "lesson.json.tmp.a1")
    argv = bare(tmp_path, "--settled", "--flagged-slides", "4")
    kept = before.read_text()
    assert module.main(argv) == 0
    assert before.read_text() == kept
    check = calls[0][1]
    assert "--settled" in check and check[check.index("--flagged-slides") + 1] == "4"
    assert [s for s, _ in calls][-1] == "overview"


def test_measuring_needs_a_lesson_to_stamp_from(tmp_path):
    module = load()
    with pytest.raises(SystemExit):
        module.main(bare(tmp_path, "--room-output", str(tmp_path / "room.json")))


def test_the_recheck_judges_the_record_before_drawing(tmp_path, monkeypatch, capsys):
    """The decorator always checked its pass record before looking at the
    pages, so a refused record costs no render."""
    module = load()
    calls = fake(module, monkeypatch, {})
    record = str(tmp_path / "optional-picture-pass.json")
    argv = bare(tmp_path, "--settled", "--pass-record", record,
                "--room", str(tmp_path / "slide-room.json"), "--library-root", "/lib",
                "--flagged-slides", "4")
    assert module.main(argv) == 0
    assert [s for s, _ in calls] == ["check", "pictures", "probe", "render", "overview"]
    pictures = calls[1][1]
    assert pictures[pictures.index("--pptx") + 1] == "/p/deck.pptx"
    assert pictures[pictures.index("--lesson") + 1].endswith("lesson.json.tmp.a1")
    assert pictures[pictures.index("--library-root") + 1] == "/lib"
    assert pictures[pictures.index("--flagged-slides") + 1] == "4"
    assert "optional-picture check passed" in capsys.readouterr().out


def test_a_refused_record_is_not_drawn(tmp_path, monkeypatch, capsys):
    module = load()
    calls = fake(module, monkeypatch, {"pictures": 1})
    argv = bare(tmp_path, "--settled", "--pass-record", str(tmp_path / "pass.json"))
    assert module.main(argv) == 1
    assert [s for s, _ in calls] == ["check", "pictures"]
    assert capsys.readouterr().out.strip().splitlines()[-1].startswith(
        "DECK_PREVIEW_STOPPED: the optional-picture check")
