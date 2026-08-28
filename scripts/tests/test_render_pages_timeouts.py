from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[2]
RENDER_SCRIPT = ROOT / "scripts" / "render-pages.py"
POWERPOINT_HELPER = ROOT / "scripts" / "powerpoint-to-pdf.py"
SPEC = importlib.util.spec_from_file_location("render_pages", RENDER_SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_powerpoint_probe_uses_thirty_second_limit():
    completed = subprocess.CompletedProcess([], 0, "POWERPOINT_PROBE_OK\n", "")
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE.subprocess, "run", return_value=completed) as run,
    ):
        assert MODULE.probe_powerpoint() is True
    assert run.call_args.kwargs["timeout"] == 30
    assert run.call_args.args[0][-1] == "--probe"


def test_powerpoint_conversion_uses_child_process_and_180_second_limit(tmp_path):
    source = tmp_path / "lesson.pptx"
    output = tmp_path / "lesson.pdf"
    source.write_bytes(b"pptx")

    def complete(command, **kwargs):
        output.write_bytes(b"pdf")
        return subprocess.CompletedProcess(command, 0, f"POWERPOINT_PDF_OK {output}\n", "")

    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE.subprocess, "run", side_effect=complete) as run,
    ):
        MODULE.powerpoint_to_pdf(source, output)
    assert run.call_args.kwargs["timeout"] == 180
    assert str(POWERPOINT_HELPER) in run.call_args.args[0]


def test_powerpoint_timeout_becomes_route_failure(tmp_path):
    source = tmp_path / "lesson.pptx"
    output = tmp_path / "lesson.pdf"
    source.write_bytes(b"pptx")
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(
            MODULE.subprocess,
            "run",
            side_effect=subprocess.TimeoutExpired(["python"], 180),
        ),
    ):
        try:
            MODULE.powerpoint_to_pdf(source, output)
        except RuntimeError as exc:
            assert str(exc) == "PowerPoint conversion exceeded 180 seconds"
        else:
            raise AssertionError("PowerPoint timeout did not become RuntimeError")


def test_powerpoint_helper_rejects_non_pptx_before_com(tmp_path):
    source = tmp_path / "not-a-deck.txt"
    output = tmp_path / "out.pdf"
    source.write_text("x", encoding="utf-8")
    completed = subprocess.run(
        [
            sys.executable,
            str(POWERPOINT_HELPER),
            "--source",
            str(source),
            "--output",
            str(output),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 1
    assert "POWERPOINT_PDF_FAILED" in completed.stderr
    assert not output.exists()
