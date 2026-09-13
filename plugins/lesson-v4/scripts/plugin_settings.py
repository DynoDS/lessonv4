"""The plugin's own folder on this computer, and the settings kept in it.

Python's half of `plugin-settings.js`; the two must agree on the folder and the
file. The settings are what a teacher chooses once and the plugin remembers:
where finished resources are saved, whether they are sorted into term, week and
day folders (and the school's term dates that sorting needs), and whether this
computer is where the plugin itself is developed.

Nothing here is school-specific. A computer with no settings gets the plain
default: resources stay in the folder the lesson was built in.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date, datetime
from pathlib import Path

HOME_VARIABLE = "LESSON_RESOURCES_HOME"


def plugin_home() -> Path:
    configured = os.environ.get(HOME_VARIABLE, "").strip()
    return Path(configured) if configured else Path.home() / ".lesson-resources"


def settings_path() -> Path:
    return plugin_home() / "settings.json"


def read_settings() -> dict:
    """A missing or unreadable file is an empty set of settings, not a fault."""
    try:
        value = json.loads(settings_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return value if isinstance(value, dict) else {}


def write_settings(changes: dict) -> dict:
    """Merge, never replace, so no part of the plugin erases another's choice."""
    merged = read_settings()
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = {**merged[key], **value}
        else:
            merged[key] = value
    home = plugin_home()
    home.mkdir(parents=True, exist_ok=True)
    target = settings_path()
    temporary = target.with_name(f"{target.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, target)
    return merged


def delivery() -> dict:
    """How finished resources leave the run.

    `none`   no folder chosen: resources stay where the run built them.
    `folder` copied straight into the chosen folder.
    `sorted` copied into `<folder>/<school year> - Year N/<term>/Week N/<subject>[/<day>]`,
             placed by the school's term dates.
    """
    chosen = read_settings().get("delivery")
    chosen = chosen if isinstance(chosen, dict) else {}
    folder = str(chosen.get("folder") or "").strip()
    term_dates = str(chosen.get("termDates") or "").strip()
    if not folder:
        return {"mode": "none", "folder": "", "termDates": "", "offered": bool(chosen.get("offered"))}
    mode = "sorted" if chosen.get("sorting") and term_dates else "folder"
    return {"mode": mode, "folder": folder, "termDates": term_dates, "offered": True}


def developer_source() -> str:
    chosen = read_settings().get("developer")
    return str(chosen.get("sourceRoot") or "").strip() if isinstance(chosen, dict) else ""


# ----------------------------------------------------------------- term dates

def _parse_date(text: str) -> date | None:
    text = re.sub(r"(\d+)(st|nd|rd|th)\b", r"\1", text.strip())
    for fmt in ("%A %d %B %Y", "%d %B %Y", "%d %b %Y", "%A %d %b %Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    return None


# "Autumn, term 1", "Autumn 1", "Spring term 4" and "Summer 2" all name one of
# the six half-terms; the folder is always "<season> <1 or 2>". A school that
# numbers its terms 1 to 6 across the year and one that restarts at 1 each
# season both land in the same folders. Holidays carry no number and are skipped.
_TERM_RE = re.compile(r"^\s*(autumn|spring|summer)\b\D*([1-6])\s*$", re.I)
_SEASON_OFFSET = {"autumn": 0, "spring": 2, "summer": 4}


def term_folder_name(label: str) -> str | None:
    match = _TERM_RE.match(label)
    if not match:
        return None
    season = match.group(1).lower()
    number = int(match.group(2))
    if number > 2:
        number -= _SEASON_OFFSET[season]
    if number not in (1, 2):
        return None
    return f"{season.capitalize()} {number}"


def read_term_dates(path: str | Path) -> list[tuple[str, date, date]]:
    """Teaching half-terms from a markdown table of `| Term | Starts | Ends |` rows."""
    rows = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if "|" not in line or "---" in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 3:
            continue
        folder = term_folder_name(parts[0])
        start, end = _parse_date(parts[1]), _parse_date(parts[2])
        if folder and start and end and start < end:
            rows.append((folder, start, end))
    return rows
