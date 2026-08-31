from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check-photo-cap.py"


def run_check(payload: dict):
    with tempfile.TemporaryDirectory() as temporary:
        path = Path(temporary) / "photo-requirements.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(path)],
            capture_output=True,
            text=True,
            check=False,
        )


def test_zero_fifteen_and_sixteen_pass():
    for count in (0, 15, 16):
        photos = [{"filename": f"unsplash/picture-{index}.jpg"} for index in range(count)]
        completed = run_check({"photos": photos})
        assert completed.returncode == 0, completed.stderr
        assert f"{count}/16" in completed.stdout


def test_seventeen_fails():
    photos = [{"filename": f"unsplash/picture-{index}.jpg"} for index in range(17)]
    completed = run_check({"photos": photos})
    assert completed.returncode == 1
    assert "PHOTO_CAP_EXCEEDED" in completed.stderr


def test_optional_context_objects_do_not_change_the_count():
    photos = [{"filename": f"unsplash/picture-{index}.jpg"} for index in range(16)]
    decorations = [
        {"kind": "educational-svg", "concept": f"icon-{index}"}
        for index in range(40)
    ]
    completed = run_check({"photos": photos, "decorations": decorations})
    assert completed.returncode == 0, completed.stderr
    assert "16/16" in completed.stdout


def test_malformed_photos_field_fails():
    completed = run_check({"photos": {}})
    assert completed.returncode == 1
    assert "PHOTO_CAP_CHECK_FAILED" in completed.stderr


def run_check_stage(payload: dict, stage: str):
    with tempfile.TemporaryDirectory() as temporary:
        path = Path(temporary) / "photo-requirements.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(path), "--stage", stage],
            capture_output=True,
            text=True,
            check=False,
        )


def _photos(count: int):
    return [{"filename": f"unsplash/picture-{index}.jpg"} for index in range(count)]


def test_run_stage_allows_a_late_picture_beyond_the_design_budget():
    """A Y4 appliances lesson used exactly 16 and had no room for an
    adaptation or helper picture, because one number served as both the
    designer's budget and the whole run's ceiling."""
    completed = run_check_stage({"photos": _photos(20)}, "run")
    assert completed.returncode == 0, completed.stderr
    assert "20/24" in completed.stdout


def test_design_stage_still_holds_the_designer_to_sixteen():
    completed = run_check_stage({"photos": _photos(17)}, "design")
    assert completed.returncode == 1
    assert "one lesson design may promote at most 16" in completed.stderr


def test_the_run_ceiling_is_still_a_ceiling():
    completed = run_check_stage({"photos": _photos(25)}, "run")
    assert completed.returncode == 1
    assert "PHOTO_CAP_EXCEEDED" in completed.stderr


def test_default_stage_is_the_design_budget():
    completed = run_check({"photos": _photos(17)})
    assert completed.returncode == 1
    assert "at most 16" in completed.stderr
