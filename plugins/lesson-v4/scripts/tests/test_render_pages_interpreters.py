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


# 6 October 2026: every Codex run prints the PowerPoint refusal, because its
# sandbox runs commands as another Windows user, and LibreOffice then draws the
# deck. One decorator was handed that refusal line alone, ten seconds into a
# fourteen second render, and reported that nothing could be looked at. The
# probe now names the route that will draw the slides, and the render says it
# has started and what its last line will be.
LOGON = (
    "POWERPOINT_PDF_FAILED: (-2147023584, 'A specified logon session does not "
    "exist. It may already have been terminated.', None, None)\n"
)


def _probe(tmp_path, answers, soffice):
    with (
        mock.patch.object(MODULE, "is_windows", return_value=True),
        mock.patch.object(MODULE, "powerpoint_interpreters", return_value=list(answers)),
        mock.patch.object(MODULE.subprocess, "run", side_effect=_run_for(answers)),
        mock.patch.object(MODULE, "find_soffice", return_value=soffice),
        mock.patch.object(MODULE.shutil, "which", return_value=None),
        mock.patch.object(MODULE, "probe_pymupdf", return_value=True),
    ):
        route_file = tmp_path / "routes.json"
        code = MODULE.probe_routes(route_file)
    return code, json.loads(route_file.read_text(encoding="utf-8"))


def test_a_refused_powerpoint_with_libreoffice_present_names_the_route_not_a_failure(
        tmp_path, capsys):
    code, routes = _probe(tmp_path, {"codex-python": (1, "", LOGON)}, "soffice")
    captured = capsys.readouterr()
    assert code == 0
    assert routes["pptxRoutes"] == ["libreoffice"]
    assert captured.out.startswith("RENDER_ROUTE_OK: slides will be drawn by LibreOffice.")
    assert "needs no action" in captured.out
    # Nothing that reads as a failure reaches the caller; the reason is kept.
    assert "UNAVAILABLE" not in captured.out + captured.err
    assert "POWERPOINT_PDF_FAILED" not in captured.out + captured.err
    assert "logon session" in routes["probeNotes"][0]


def test_a_working_powerpoint_is_named_as_the_route(tmp_path, capsys):
    code, routes = _probe(
        tmp_path, {"system-python": (0, "POWERPOINT_PROBE_OK\n", "")}, "soffice")
    captured = capsys.readouterr()
    assert code == 0
    assert routes["pptxRoutes"] == ["powerpoint", "libreoffice"]
    assert captured.out.strip() == "RENDER_ROUTE_OK: slides will be drawn by PowerPoint."
    assert captured.err == ""


def test_no_slide_route_at_all_still_raises_the_alarm(tmp_path, capsys):
    code, routes = _probe(tmp_path, {"codex-python": (1, "", LOGON)}, None)
    captured = capsys.readouterr()
    assert code == 0
    assert routes["pptxRoutes"] == []
    assert "RENDER_ROUTE_OK" not in captured.out
    assert "RENDER_PROBE_POWERPOINT_UNAVAILABLE" in captured.err
    assert "logon session" in captured.err


def _render_a_pdf(tmp_path, capsys, pages_or_error):
    source = tmp_path / "deck.pdf"
    source.write_bytes(b"%PDF-1.4 stand-in")
    route_file = tmp_path / "routes.json"
    route_file.write_text(json.dumps({
        "version": 1, "pptxRoutes": [], "docxRoutes": [], "pdfRoutes": ["pymupdf"],
    }), encoding="utf-8")
    seen_before_the_work = {}

    def draw(pdf_path, routes, out_dir, stem, dpi):
        # What the caller has been told by the time the slow part begins.
        seen_before_the_work["err"] = capsys.readouterr().err
        if isinstance(pages_or_error, Exception):
            raise pages_or_error
        files = []
        for number in range(1, pages_or_error + 1):
            page = Path(out_dir, f"{stem}-page-{number:02d}.png")
            page.write_bytes(b"png")
            files.append(page)
        return files, "pymupdf"

    with (
        mock.patch.object(MODULE, "render_pdf_pages", side_effect=draw),
        mock.patch.object(MODULE, "contact_sheet", return_value=None),
    ):
        code = MODULE.render(
            str(source), str(tmp_path / "out"), str(route_file),
            str(tmp_path / "manifest.json"), 110)
    return code, seen_before_the_work["err"], capsys.readouterr()


def test_a_render_says_it_is_running_before_the_slow_work_and_says_when_it_is_done(
        tmp_path, capsys):
    code, before, after = _render_a_pdf(tmp_path, capsys, 3)
    assert code == 0
    # Already printed when the drawing starts, and it names both last lines, so
    # an output read early cannot be taken for a render that produced nothing.
    assert before.startswith("RENDER_PAGES_RUNNING: drawing the pages of deck.pdf.")
    assert "RENDER_PAGES_OK" in before and "VISUAL_ROUTE_UNVERIFIED" in before
    assert "still running" in before
    assert "RENDER_PAGES_OK: 3 pages drawn by" in after.err
    assert str((tmp_path / "manifest.json").resolve()) in after.err
    # Standard output is still the page list and nothing else.
    assert len(json.loads(after.out)["pages"]) == 3


def test_a_render_with_no_route_still_ends_on_the_unverified_line(tmp_path, capsys):
    code, before, after = _render_a_pdf(tmp_path, capsys, RuntimeError("pymupdf: boom"))
    assert code == 2
    assert before.startswith("RENDER_PAGES_RUNNING:")
    assert "VISUAL_ROUTE_UNVERIFIED: deck.pdf" in after.err
    assert "RENDER_PAGES_OK" not in after.err
    assert after.out == ""


def test_the_roles_that_render_decide_from_the_lines_the_script_prints():
    """The three slide roles say when a look was impossible by naming the
    render's own closing lines. Those names are an interface: if the script
    stops printing one, the roles are waiting for a line that never comes."""
    script = RENDER_SCRIPT.read_text(encoding="utf-8")
    every = ("RENDER_PAGES_OK", "RENDER_PAGES_RUNNING", "VISUAL_ROUTE_UNVERIFIED")
    # The repair entry point is held under a byte budget, so it names only the
    # one line that means nothing could be drawn.
    named = {
        "slide-decorator": every,
        "slide-designer": every,
        "slide-designer-focused-repair": ("VISUAL_ROUTE_UNVERIFIED",),
    }
    for role, markers in named.items():
        text = (ROOT / "agents" / f"{role}.md").read_text(encoding="utf-8")
        for marker in markers:
            assert marker in text, f"{role}.md no longer names {marker}"
            assert marker in script, f"render-pages.py no longer prints {marker}"
