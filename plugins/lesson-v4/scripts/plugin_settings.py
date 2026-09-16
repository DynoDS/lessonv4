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


LETTERBOX_VARIABLE = "LESSON_RESOURCES_LETTERBOX"
LETTERBOX_BRANCH_VARIABLE = "LESSON_RESOURCES_LETTERBOX_BRANCH"
# Cloud sessions may always push to a `claude/` branch; other branch names can
# be refused. A branch of its own also keeps these lessons apart from anything
# else a letterbox repository carries.
DEFAULT_LETTERBOX_BRANCH = "claude/lesson-outbox"
# The files the login filer needs, copied out of the package when it is
# installed so the task at login does not point into a versioned package folder
# that the next update removes. check-setup.js keeps its own copy of this list.
FILER_FILES = ("letterbox_filer.py", "plugin_settings.py", "deliver_files.py", "resolve-filing.py")


def _git_remote(folder: Path) -> str:
    try:
        text = (folder / ".git" / "config").read_text(encoding="utf-8")
    except OSError:
        return ""
    match = re.search(r'\[remote "origin"\][^\[]*?url\s*=\s*(\S+)', text)
    return match.group(1) if match else ""


def letterbox_writer() -> dict | None:
    """The letterbox a cloud run drops its resources into, or None.

    A cloud box cannot reach the teacher's computer, so its environment names a
    clone of a repository both can reach: either the clone's folder, or the
    repository's name (`owner/name`), in which case the clone is looked for
    beside the working folder and beside the plugin's own repository, because
    how a cloud session lays out several attached repositories is not
    documented and has changed before.
    """
    configured = os.environ.get(LETTERBOX_VARIABLE, "").strip()
    if not configured:
        return None
    branch = os.environ.get(LETTERBOX_BRANCH_VARIABLE, "").strip() or DEFAULT_LETTERBOX_BRANCH
    direct = Path(configured).expanduser()
    if (direct / ".git").exists():
        return {"clone": str(direct), "branch": branch}
    name = configured.lower().removesuffix(".git").strip("/")
    places = [plugin_home() / LETTERBOX_CLONE_NAME]
    for start in (Path.cwd(), Path(__file__).resolve()):
        for folder in [start, *start.parents][:6]:
            places.append(folder)
            try:
                places.extend(child for child in folder.iterdir() if child.is_dir())
            except OSError:
                continue
    seen = set()
    for folder in places:
        key = str(folder).lower()
        if key in seen:
            continue
        seen.add(key)
        remote = _git_remote(folder).lower().removesuffix(".git")
        if remote and (remote.endswith("/" + name) or remote.endswith(":" + name)):
            return {"clone": str(folder), "branch": branch}
    return {"clone": "", "branch": branch, "missing": configured}


LETTERBOX_CLONE_NAME = "letterbox-clone"


def github_auth_args() -> list[str]:
    """Git options that sign in to GitHub with GITHUB_TOKEN, or nothing.

    Codex's cloud attaches only one repository and gives the agent no GitHub
    sign-in, so the letterbox is reached with a key the teacher adds to the
    environment (a fine-grained token limited to the letterbox repository;
    proved on 13 September 2026). It is passed as a header on each command
    rather than written into the clone's remote address, so the key never
    lands in a file and never appears in git's own messages.
    """
    import base64

    token = (os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or "").strip()
    if not token:
        return []
    basic = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    return ["-c", f"http.https://github.com/.extraheader=AUTHORIZATION: basic {basic}"]


def letterbox_git_args() -> list[str]:
    """Git options for every command that touches the letterbox.

    The letterbox carries finished files byte for byte, and each lesson records
    a check of every file as it was built. Git for Windows turns line-ending
    conversion on for every repository, which rewrote the answers text on its
    way out of the clone and made the filer refuse it as damaged (16 September
    2026), so conversion is switched off here whatever the computer's setting.
    """
    return ["-c", "core.autocrlf=false", *github_auth_args()]


def prepare_letterbox(url: str | None = None) -> dict | None:
    """Fetch the letterbox when the environment names it but nothing attached it.

    Returns the writer (as `letterbox_writer`) with its clone filled in, or with
    `error` saying why it could not be fetched. Only for a named repository;
    a folder that is not there is a configuration fault, not something to fetch.
    """
    import subprocess

    writer = letterbox_writer()
    if writer is None or writer.get("clone"):
        return writer
    name = writer.get("missing", "").strip().removesuffix(".git").strip("/")
    if not url and not re.fullmatch(r"[\w.-]+/[\w.-]+", name):
        return {**writer, "error": f"{name!r} is not a folder or an owner/name repository"}
    target = plugin_home() / LETTERBOX_CLONE_NAME
    if not (target / ".git").exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        source = url or f"https://github.com/{name}.git"
        result = subprocess.run(
            ["git", *letterbox_git_args(), "clone", "-q", source, str(target)],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            reason = (result.stderr or result.stdout).strip().splitlines()[-1:] or ["no reason given"]
            hint = "" if github_auth_args() else " No GITHUB_TOKEN is set, and a private letterbox needs one."
            return {**writer, "error": f"the letterbox could not be fetched ({reason[0]}).{hint}"}
    return {"clone": str(target), "branch": writer["branch"]}


def delivery(ignore_letterbox: bool = False) -> dict:
    """How finished resources leave the run.

    `none`      no folder chosen: resources stay where the run built them.
    `folder`    copied straight into the chosen folder.
    `sorted`    copied into `<folder>/<school year> - Year N/<term>/Week N/<subject>[/<day>]`,
                placed by the school's term dates.
    `letterbox` a cloud run: pushed to a repository the teacher's computer
                collects from at login (letterbox_filer.py), where the saved
                folder and sorting are applied.
    """
    writer = None if ignore_letterbox else letterbox_writer()
    if writer is not None:
        return {"mode": "letterbox", "folder": writer["clone"], "termDates": "", "offered": True,
                "branch": writer["branch"], "missing": writer.get("missing", "")}
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
