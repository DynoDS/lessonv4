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
