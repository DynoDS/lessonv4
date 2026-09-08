"""The PowerPoint route needs pywin32 in the interpreter that runs the helper,
and the interpreter running render-pages.py is not always the one that has it.
Codex's bundled Python has no win32com; a run started from it heard "No module
named 'win32com'" and recorded that as no PowerPoint on a machine whose system
Python could have rendered the deck (8 September 2026). The probe now asks each
interpreter it can find and records the one that answered for the conversion.
"""
from __future__ import annotations

import importlib.util
import json
import subprocess
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
RENDER_SCRIPT = ROOT / "scripts" / "render-pages.py"
SPEC = importlib.util.spec_from_file_location("render_pages_interp", RENDER_SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

NO_MODULE = "POWERPOINT_PDF_FAILED: No module named 'win32com'\n"


def _run_for(answers):
    def run(command, **kwargs):
        interpreter = command[0]
        code, out, err = answers[interpreter]
        return subprocess.CompletedProcess(command, code, out, err)
    return run


def test_probe_falls_back_to_an_interpreter_that_has_the_com_module(tmp_path):
    answers = {
        "codex-python": (1, "", NO_MODULE),
        "system-python": (0, "POWERPOINT_PROBE_OK\n", ""),
    }
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE, "powerpoint_interpreters",
                          return_value=["codex-python", "system-python"]),
        mock.patch.object(MODULE.subprocess, "run", side_effect=_run_for(answers)) as run,
        mock.patch.object(MODULE, "find_soffice", return_value=None),
        mock.patch.object(MODULE.shutil, "which", return_value=None),
        mock.patch.object(MODULE, "probe_pymupdf", return_value=False),
    ):
        interpreter, notes = MODULE.probe_powerpoint_interpreter()
        assert interpreter == "system-python"
        assert notes == ["codex-python: POWERPOINT_PDF_FAILED: No module named 'win32com'"]
        assert run.call_count == 2

        route_file = tmp_path / "routes.json"
        assert MODULE.probe_routes(route_file) == 0
    routes = json.loads(route_file.read_text(encoding="utf-8"))
    assert routes["pptxRoutes"] == ["powerpoint"]
    assert routes["powerpointPython"] == "system-python"
    assert routes["blockedProbes"] == []


def test_probe_stops_when_powerpoint_itself_said_no():
    answers = {
        "codex-python": (1, "", "POWERPOINT_PDF_FAILED: Invalid class string\n"),
        "system-python": (0, "POWERPOINT_PROBE_OK\n", ""),
    }
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE, "powerpoint_interpreters",
                          return_value=["codex-python", "system-python"]),
        mock.patch.object(MODULE.subprocess, "run", side_effect=_run_for(answers)) as run,
    ):
        interpreter, notes = MODULE.probe_powerpoint_interpreter()
    # PowerPoint answered; another interpreter cannot change what it said.
    assert interpreter is None
    assert run.call_count == 1
    assert notes == ["codex-python: POWERPOINT_PDF_FAILED: Invalid class string"]


def test_a_missing_module_everywhere_is_named_not_read_as_absence(tmp_path, capsys):
    answers = {"codex-python": (1, "", NO_MODULE)}
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE, "powerpoint_interpreters", return_value=["codex-python"]),
        mock.patch.object(MODULE.subprocess, "run", side_effect=_run_for(answers)),
        mock.patch.object(MODULE, "find_soffice", return_value=None),
        mock.patch.object(MODULE.shutil, "which", return_value=None),
        mock.patch.object(MODULE, "probe_pymupdf", return_value=False),
    ):
        route_file = tmp_path / "routes.json"
        assert MODULE.probe_routes(route_file) == 0
    captured = capsys.readouterr()
    assert "RENDER_PROBE_POWERPOINT_UNAVAILABLE" in captured.err
    assert "pywin32" in captured.err
    routes = json.loads(route_file.read_text(encoding="utf-8"))
    assert routes["pptxRoutes"] == []
    assert routes["powerpointPython"] is None
    assert routes["probeNotes"] == ["codex-python: POWERPOINT_PDF_FAILED: No module named 'win32com'"]


def test_conversion_runs_the_helper_with_the_recorded_interpreter(tmp_path):
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
        MODULE.powerpoint_to_pdf(source, output, "system-python")
    assert run.call_args.args[0][0] == "system-python"
