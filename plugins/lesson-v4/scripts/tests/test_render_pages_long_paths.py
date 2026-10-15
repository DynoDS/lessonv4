"""A long working directory must not decide whether a lesson can be reviewed.

PowerPoint COM refuses a filename over 255 characters ("Invalid request.
Filename cannot exceed 255 characters") and poppler's pdftoppm cannot open one
either, whatever the operating system allows. A workspace nested a few folders
deep passes that mark easily, so render-pages.py converts and rasterises inside
a short scratch directory and copies the finished evidence out.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from unittest import mock

import pytest


ROOT = Path(__file__).resolve().parents[2]
RENDER_SCRIPT = ROOT / "scripts" / "render-pages.py"
SPEC = importlib.util.spec_from_file_location("render_pages_long", RENDER_SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

OVER_LIMIT = "C:/" + "deep/" * 60 + "deck.pptx"


def write_route_file(path):
    path.write_text(
        json.dumps({
            "version": MODULE.ROUTE_VERSION,
            "pptxRoutes": ["powerpoint"],
            "docxRoutes": [],
            "pdfRoutes": ["pdftoppm"],
        }),
        encoding="utf-8",
    )


def recording_converters(seen):
    """Stand in for the two legacy converters, recording what they were handed."""

    def office(src, out_pdf):
        seen.append(Path(src))
        seen.append(Path(out_pdf))
        Path(out_pdf).write_bytes(b"%PDF-1.4 stub")

    def pages(pdf_path, out_dir, stem, dpi):
        seen.append(Path(pdf_path))
        seen.append(Path(out_dir))
        produced = []
        for number in (1, 2):
            page = Path(out_dir) / f"{stem}-page-{number:02d}.png"
            page.write_bytes(b"png")
            produced.append(page)
        return produced

    return office, pages


def run_render(source, out_dir, tmp_path, seen):
    office, pages = recording_converters(seen)
    route_file = tmp_path / "route.json"
    write_route_file(route_file)
    manifest_file = tmp_path / "manifest.json"
    with (
        mock.patch.object(MODULE, "powerpoint_to_pdf", side_effect=office),
        mock.patch.object(MODULE, "render_pdftoppm", side_effect=pages),
    ):
        code = MODULE.render(str(source), str(out_dir), str(route_file),
                             str(manifest_file), 110)
    assert code == 0
    return json.loads(manifest_file.read_text(encoding="utf-8"))


def deep_directory(tmp_path):
    """A directory deep enough to defeat the legacy tools, or a skip."""
    deep = tmp_path
    while len(str(deep)) < MODULE.LEGACY_TOOL_PATH_LIMIT:
        deep = deep / ("segment" * 4)
    try:
        deep.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        pytest.skip(f"this filesystem refuses a {len(str(deep))}-character path: {exc}")
    return deep


def test_converters_are_handed_scratch_paths_not_the_callers(tmp_path):
    source = tmp_path / "lesson.pptx"
    source.write_bytes(b"pptx")
    seen: list[Path] = []
    run_render(source, tmp_path / "evidence", tmp_path, seen)
    assert seen, "neither converter was reached"
    for path in seen:
        assert any(part.startswith("render-pages-") for part in path.parts), (
            f"{path} is outside the scratch directory, so its length is the "
            "caller's to control rather than this script's"
        )


def test_a_deeply_nested_workspace_still_renders(tmp_path):
    deep = deep_directory(tmp_path)
    source = deep / "Year 4 PSHE balanced diet lesson deck.pptx"
    source.write_bytes(b"pptx")
    out_dir = deep / "render-evidence"
    seen: list[Path] = []
    manifest = run_render(source, out_dir, tmp_path, seen)

    for path in seen:
        assert len(str(path)) <= MODULE.LEGACY_TOOL_PATH_LIMIT, (
            f"{len(str(path))} characters reached a converter that stops at "
            f"{MODULE.LEGACY_TOOL_PATH_LIMIT}"
        )
    assert len(manifest["pages"]) == 2
    for page in manifest["pages"]:
        assert Path(page["path"]).is_file()
        assert Path(page["path"]).parent == out_dir
    assert Path(manifest["pdf"]["path"]).is_file()
    assert manifest["source"] == str(source)


def test_powerpoint_refuses_an_over_limit_path_before_opening_com():
    with mock.patch.object(MODULE, "is_windows", return_value=True):
        with pytest.raises(RuntimeError) as raised:
            MODULE.powerpoint_to_pdf(Path(OVER_LIMIT), Path("C:/out.pdf"))
    assert "PowerPoint" in str(raised.value)
    assert str(MODULE.LEGACY_TOOL_PATH_LIMIT) in str(raised.value)


def test_libreoffice_refuses_an_over_limit_path_before_converting(tmp_path):
    with mock.patch.object(MODULE, "find_soffice", return_value="soffice"):
        with pytest.raises(RuntimeError) as raised:
            MODULE.libreoffice_to_pdf(Path(OVER_LIMIT), tmp_path / "out.pdf", tmp_path)
    assert "LibreOffice" in str(raised.value)
    assert str(MODULE.LEGACY_TOOL_PATH_LIMIT) in str(raised.value)


def profile_path(uri):
    """The plain folder path behind a file:// URI."""
    from urllib.parse import urlparse, unquote
    path = unquote(urlparse(uri).path)
    if len(path) > 2 and path[0] == "/" and path[2] == ":":
        path = path[1:]
    return str(Path(path))


def test_libreoffice_settings_folder_stays_short_inside_a_long_lesson_folder(tmp_path):
    # LibreOffice writes a settings tree about 110 characters deeper than the
    # folder it is given, and crashes (exit 3221226505) once that folder's path
    # passes 148 characters. On 15 October 2026 every Codex slide preview
    # crashed this way: the workers kept their scratch inside the lesson folder,
    # whose name is long, and the settings folder went where the scratch went.
    scratch = tmp_path
    while len(str(scratch)) < 160:
        scratch = scratch / "year-4-maths-lesson-27-column-addition"
    scratch.mkdir(parents=True)
    src = scratch / "staged-source.pptx"
    src.write_bytes(b"pptx")
    seen = []

    def soffice(cmd, **_kwargs):
        seen.append(next(a for a in cmd if a.startswith("-env:UserInstallation=")))
        Path(scratch, src.stem + ".pdf").write_bytes(b"%PDF-1.4 stub")
        return mock.Mock(returncode=0, stdout="", stderr="")

    with (
        mock.patch.object(MODULE, "find_soffice", return_value="soffice"),
        mock.patch.object(MODULE.subprocess, "run", side_effect=soffice),
    ):
        MODULE.libreoffice_to_pdf(src, scratch / "out.pdf", scratch)

    folder = profile_path(seen[0].split("=", 1)[1])
    assert len(folder) <= MODULE.LIBREOFFICE_PROFILE_PATH_LIMIT, (
        f"LibreOffice was given a {len(folder)}-character settings folder; it "
        f"crashes past 148")
    assert not Path(folder).exists(), "the settings folder was left behind"


def test_libreoffice_settings_folder_stays_in_the_scratch_folder_when_it_fits(tmp_path):
    src = tmp_path / "staged-source.pptx"
    src.write_bytes(b"pptx")
    seen = []

    def soffice(cmd, **_kwargs):
        seen.append(next(a for a in cmd if a.startswith("-env:UserInstallation=")))
        Path(tmp_path, src.stem + ".pdf").write_bytes(b"%PDF-1.4 stub")
        return mock.Mock(returncode=0, stdout="", stderr="")

    with (
        mock.patch.object(MODULE, "find_soffice", return_value="soffice"),
        mock.patch.object(MODULE.subprocess, "run", side_effect=soffice),
    ):
        MODULE.libreoffice_to_pdf(src, tmp_path / "out.pdf", tmp_path)

    assert Path(profile_path(seen[0].split("=", 1)[1])).parent == tmp_path


def test_pdftoppm_refuses_an_over_limit_path_before_running(tmp_path):
    with mock.patch.object(MODULE.shutil, "which", return_value="pdftoppm"):
        with pytest.raises(RuntimeError) as raised:
            MODULE.render_pdftoppm(Path(OVER_LIMIT), tmp_path, "deck", 110)
    assert "pdftoppm" in str(raised.value)
    assert str(MODULE.LEGACY_TOOL_PATH_LIMIT) in str(raised.value)
