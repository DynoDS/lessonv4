#!/usr/bin/env python3
"""Run PowerPoint COM work in an isolated process."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
import python_extras  # noqa: F401,E402 - the plugin's own installed libraries


def open_powerpoint():
    if os.name != "nt":
        raise RuntimeError("PowerPoint COM is not available off Windows")
    import pythoncom  # type: ignore
    import win32com.client  # type: ignore

    pythoncom.CoInitialize()
    try:
        app = win32com.client.DispatchEx("PowerPoint.Application")
    except BaseException:
        pythoncom.CoUninitialize()
        raise
    return pythoncom, app


def probe() -> int:
    pythoncom = None
    app = None
    try:
        pythoncom, app = open_powerpoint()
        _ = app.Presentations.Count
        print("POWERPOINT_PROBE_OK")
        return 0
    finally:
        if app is not None:
            app.Quit()
        if pythoncom is not None:
            pythoncom.CoUninitialize()


def convert(source: Path, output: Path) -> int:
    pythoncom = None
    app = None
    presentation = None
    try:
        pythoncom, app = open_powerpoint()
        presentation = app.Presentations.Open(str(source), WithWindow=False)
        presentation.SaveAs(str(output), 32)
        if not output.is_file():
            raise RuntimeError("PowerPoint did not produce a PDF")
        print(f"POWERPOINT_PDF_OK {output}")
        return 0
    finally:
        if presentation is not None:
            presentation.Close()
        if app is not None:
            app.Quit()
        if pythoncom is not None:
            pythoncom.CoUninitialize()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--source")
    parser.add_argument("--output")
    args = parser.parse_args(argv)

    if args.probe:
        if args.source or args.output:
            parser.error("--probe cannot be combined with --source or --output")
        return probe()
    if not args.source or not args.output:
        parser.error("conversion requires --source and --output")

    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    if not source.is_file() or source.suffix.lower() != ".pptx":
        raise RuntimeError(f"PowerPoint source is not a PPTX file: {source}")
    output.parent.mkdir(parents=True, exist_ok=True)
    return convert(source, output)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"POWERPOINT_PDF_FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
