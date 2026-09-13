#!/usr/bin/env python3
"""Read and change what the teacher has chosen for this computer.

    python lesson-settings.py show
    python lesson-settings.py save-folder "<folder>"
    python lesson-settings.py sorting on "<term dates file>"
    python lesson-settings.py sorting off
    python lesson-settings.py offered
    python lesson-settings.py developer on "<plugin source folder>"
    python lesson-settings.py developer off

Every choice is kept in the plugin's own folder (plugin_settings.py), outside
the package, so an update never forgets it. Each command checks what it is
given before saving it, because a setting that is wrong is found only at the end
of the next lesson run, when the resources have nowhere to go.

Output: `SETTINGS_SAVED` then the settings as `KEY=value` lines, or
`SETTINGS_ERROR: <plain reason>` with exit 1 and nothing changed.
"""
from __future__ import annotations

import importlib.util
import shutil
import sys
from pathlib import Path

import plugin_settings

SCRIPTS = Path(__file__).resolve().parent


def show() -> None:
    chosen = plugin_settings.delivery()
    print(f"DELIVERY={chosen['mode']}")
    print(f"SAVE_FOLDER={chosen['folder']}")
    print(f"TERM_DATES={chosen['termDates']}")
    print(f"DELIVERY_OFFERED={'yes' if chosen['offered'] else 'no'}")
    print(f"DEVELOPER_SOURCE={plugin_settings.developer_source()}")


def fail(message: str) -> int:
    print(f"SETTINGS_ERROR: {message}")
    return 1


def save_folder(raw: str) -> int:
    folder = Path(raw).expanduser()
    if not folder.is_absolute():
        return fail(f"the save folder must be a full path, not {raw!r}")
    try:
        folder.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        return fail(f"the folder {folder} cannot be made or reached ({exc})")
    plugin_settings.write_settings({"delivery": {"folder": str(folder), "offered": True}})
    return 0


def sorting(state: str, raw: str | None) -> int:
    if state == "off":
        plugin_settings.write_settings({"delivery": {"sorting": False}})
        return 0
    if state != "on" or not raw:
        return fail("use: sorting on \"<term dates file>\", or sorting off")
    if not plugin_settings.delivery()["folder"]:
        return fail("choose a save folder first; sorting arranges lessons inside it")
    source = Path(raw).expanduser()
    try:
        rows = plugin_settings.read_term_dates(source)
    except OSError as exc:
        return fail(f"the term dates file cannot be read ({exc})")
    if not rows:
        return fail(
            "no teaching terms were found in that file; it needs a table of "
            "| Term | Starts | Ends | rows such as | Autumn 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |"
        )
    # A copy in the plugin's own folder, so the dates survive the file they came
    # from being moved or edited mid-year.
    target = plugin_settings.plugin_home() / "term-dates.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != target.resolve():
        shutil.copyfile(source, target)
    plugin_settings.write_settings({"delivery": {"sorting": True, "termDates": str(target)}})
    print(f"TERMS_FOUND={', '.join(name for name, _, _ in rows)}")
    return 0


def developer(state: str, raw: str | None) -> int:
    if state == "off":
        plugin_settings.write_settings({"developer": {"sourceRoot": ""}})
        return 0
    if state != "on" or not raw:
        return fail("use: developer on \"<plugin source folder>\", or developer off")
    spec = importlib.util.spec_from_file_location("verify_plugin_root", SCRIPTS / "verify-plugin-root.py")
    verifier = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(verifier)
    try:
        root = verifier.verify(raw, source=True)
    except verifier.RootError as exc:
        return fail(f"that is not a writable copy of the plugin ({exc})")
    plugin_settings.write_settings({"developer": {"sourceRoot": str(root)}})
    return 0


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    command = args[0] if args else "show"
    rest = args[1:]
    if command == "show":
        show()
        return 0
    if command == "save-folder" and len(rest) == 1:
        code = save_folder(rest[0])
    elif command == "sorting" and rest:
        code = sorting(rest[0], rest[1] if len(rest) > 1 else None)
    elif command == "offered" and not rest:
        plugin_settings.write_settings({"delivery": {"offered": True}})
        code = 0
    elif command == "developer" and rest:
        code = developer(rest[0], rest[1] if len(rest) > 1 else None)
    else:
        return fail(f"unknown command {' '.join(args)!r}; see the top of lesson-settings.py")
    if code == 0:
        print("SETTINGS_SAVED")
        show()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
