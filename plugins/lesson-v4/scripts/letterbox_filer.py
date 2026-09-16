#!/usr/bin/env python3
"""Collect lessons built in the cloud and save them on this computer.

    python letterbox_filer.py install --repo <git url or owner/name> [--branch <b>]
    python letterbox_filer.py run [--dry-run]
    python letterbox_filer.py status
    python letterbox_filer.py uninstall

A cloud run cannot reach the teacher's computer, so it pushes each lesson's
teaching resources to a letterbox: a branch of a GitHub repository that both
can reach (deliver_files.py, `send_to_letterbox`). This script is the other
half. It runs at every login, finds whatever is waiting, saves each lesson the
way this computer's settings say (a plain folder, or sorted by term, week and
day, placed now, when the drive can be seen), and only then removes the lesson
from the letterbox. With nothing waiting it does nothing.

`install` clones the letterbox, copies this script and the three it uses out of
the package into the plugin's own folder, and registers it to run at login.
The copies matter: a login task pointing into the installed package would break
at the next update, which replaces that folder. The start-up check refreshes
the copies when a new version changes them.

Safety, because it runs unattended:
- a lesson leaves the letterbox only after every one of its files is confirmed
  in place;
- a file whose size or fingerprint differs from the `checks` in its lesson.json
  was broken while being posted and is never saved: the lesson stays;
- an existing file with different contents is never overwritten: the lesson
  stays in the letterbox and the log says why;
- a lesson already saved (recorded in `letterbox-filed.json`) is never saved a
  second time, so a push that failed after a save cannot create a duplicate in
  the next free day.

Everything is written to `letterbox.log` in the plugin's folder.
"""
from __future__ import annotations

import argparse
import filecmp
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
# The installed copy lives in `<plugin folder>/filer`, and a task at login starts
# with none of the environment the install ran in, so the copy takes its plugin
# folder from where it sits rather than from a default that may be another one.
if HERE.name == "filer" and (HERE.parent / "settings.json").is_file():
    os.environ.setdefault("LESSON_RESOURCES_HOME", str(HERE.parent))

import plugin_settings  # noqa: E402
import deliver_files  # noqa: E402

_spec = importlib.util.spec_from_file_location("resolve_filing", HERE / "resolve-filing.py")
resolve_filing = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(resolve_filing)

TASK_NAME = "Lesson resources letterbox"
STARTUP_FILE = "Lesson resources letterbox.cmd"


def home() -> Path:
    return plugin_settings.plugin_home()


def log(message: str) -> None:
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S}  {message}"
    print(line)
    try:
        home().mkdir(parents=True, exist_ok=True)
        with (home() / "letterbox.log").open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except OSError:
        pass


def git(clone: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return deliver_files.git(clone, *args, check=check)


def letterbox_settings() -> dict:
    chosen = plugin_settings.read_settings().get("letterbox")
    return chosen if isinstance(chosen, dict) else {}


def ledger_path() -> Path:
    return home() / "letterbox-filed.json"


def read_ledger() -> dict:
    try:
        return json.loads(ledger_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def write_ledger(ledger: dict) -> None:
    ledger_path().write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")


# ------------------------------------------------------------------------ run

def destination_for_lesson(manifest: dict, chosen: dict, today: date) -> tuple[Path | None, str]:
    """Where this lesson goes on this computer, or (None, why not)."""
    folder = Path(chosen["folder"])
    if chosen["mode"] == "folder":
        return folder, ""
    year = str(manifest.get("year") or "")
    subject = str(manifest.get("subject") or "")
    if not year or not subject:
        return None, "its lesson.json names no year or subject, so it cannot be sorted"
    filing = resolve_filing.SortedFiling(str(folder), chosen["termDates"], year, subject, "")
    slot = filing.place(today)
    if "error" in slot:
        return None, f"no slot: {slot['error']}"
    school_year = deliver_files.derive_school_year(Path(chosen["termDates"]))
    return deliver_files.destination_for(
        folder, school_year, int(year), slot["term"], slot["week"], subject, slot["day"]
    ), ""


def file_lesson(lesson_dir: Path, manifest: dict, destination: Path, dry_run: bool) -> str:
    """'' when every file is in place, otherwise why the lesson stays."""
    names = [name for name in manifest.get("files") or [] if (lesson_dir / name).is_file()]
    if not names:
        return "it holds none of the files its lesson.json lists"
    # A file that no longer matches what was built was broken on its way into
    # the letterbox, and saving it puts a resource on the drive that will not
    # open. A lesson posted before checks were recorded has none to compare.
    checks = manifest.get("checks") if isinstance(manifest.get("checks"), dict) else {}
    for name in names:
        expected = checks.get(name)
        if isinstance(expected, dict) and deliver_files.file_check(lesson_dir / name) != expected:
            got = (lesson_dir / name).stat().st_size
            return (f"{name} arrived damaged ({got} bytes where {expected.get('bytes')} were built), "
                    "so it was broken while being posted; post it again from the run's output")
    for name in names:
        target = destination / name
        if target.exists() and not filecmp.cmp(lesson_dir / name, target, shallow=False):
            return f"{target} already exists with different contents, and a saved file is never overwritten"
    if dry_run:
        return ""
    destination.mkdir(parents=True, exist_ok=True)
    for name in names:
        target = destination / name
        if not target.exists():
            shutil.copy2(lesson_dir / name, target)
        if not filecmp.cmp(lesson_dir / name, target, shallow=False):
            return f"{target} did not copy correctly"
    return ""


def mark_plan_saved(clone: Path, manifest: dict) -> str:
    """Move the lesson's plan on to 'saved up to' its number, in the letterbox.

    The same rule as plan-tracker.py set-filed (never backwards), written here
    rather than imported because this script runs from a copy that carries only
    the files it needs. Returns the file changed, relative to the clone, or ''.
    """
    plan = str(manifest.get("plan") or "")
    index = manifest.get("planIndex")
    folder = clone / "plans" / plan
    if not plan or not isinstance(index, int) or not (folder / "plan.json").is_file():
        return ""
    filed_path = folder / "filed.json"
    try:
        current = int(json.loads(filed_path.read_text(encoding="utf-8")).get("up_to", 0))
    except (OSError, ValueError):
        current = 0
    if index <= current:
        return ""
    filed_path.write_text(json.dumps({"up_to": index, "updated": datetime.now().isoformat(),
                                      "why": "saved to the drive"}, indent=2) + "\n", encoding="utf-8")
    return f"plans/{plan}/filed.json"


def wake_onedrive() -> None:
    # Saved files reach the school's copy only once OneDrive syncs them. Start
    # it only when something was saved and it is not already running, so a
    # login with nothing waiting never switches it on.
    if sys.platform != "win32":
        return
    exe = Path(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "OneDrive", "OneDrive.exe")
    running = subprocess.run(["tasklist", "/FI", "IMAGENAME eq OneDrive.exe"], capture_output=True, text=True)
    if exe.is_file() and "OneDrive.exe" not in running.stdout:
        subprocess.Popen([str(exe), "/background"])
        log("started OneDrive so the saved lessons sync")


def run(dry_run: bool = False, today: date | None = None) -> int:
    settings = letterbox_settings()
    clone = Path(settings.get("clone") or "")
    branch = settings.get("branch") or plugin_settings.DEFAULT_LETTERBOX_BRANCH
    if not (clone / ".git").exists():
        log("no letterbox is installed on this computer; nothing to collect")
        return 0
    # This computer's own choice, even on a box whose environment names a letterbox.
    chosen = plugin_settings.delivery(ignore_letterbox=True)
    if chosen["mode"] not in ("folder", "sorted"):
        log("no save folder is set on this computer, so lessons stay in the letterbox")
        return 0
    if not Path(chosen["folder"]).is_dir():
        log(f"the save folder {chosen['folder']} is not available; lessons stay in the letterbox until next login")
        return 0

    if git(clone, "fetch", "-q", "origin", branch, check=False).returncode != 0:
        log(f"nothing has been posted to {branch} yet, or the letterbox could not be reached")
        return 0
    git(clone, "checkout", "-q", "-B", branch, f"origin/{branch}")
    # The letterbox is written only by runs and by this script; a local change
    # is a half-finished earlier attempt, and the remote is the truth.
    git(clone, "reset", "-q", "--hard", f"origin/{branch}")

    ledger = read_ledger()
    today = today or date.today()
    saved, removed, plan_files = 0, [], []
    for manifest_path in sorted((clone / "lessons").glob("*/lesson.json")):
        lesson_dir = manifest_path.parent
        name = lesson_dir.name
        if name in ledger:
            log(f"{name}: already saved to {ledger[name]}; clearing it from the letterbox")
            removed.append(name)
            continue
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except ValueError:
            log(f"{name}: lesson.json is unreadable; left in the letterbox")
            continue
        destination, why = destination_for_lesson(manifest, chosen, today)
        if destination is None:
            log(f"{name}: {why}; left in the letterbox")
            continue
        problem = file_lesson(lesson_dir, manifest, destination, dry_run)
        if problem:
            log(f"{name}: {problem}; left in the letterbox")
            continue
        if dry_run:
            log(f"{name}: would be saved to {destination}")
            continue
        ledger[name] = str(destination)
        write_ledger(ledger)
        log(f"{name}: saved to {destination}")
        changed = mark_plan_saved(clone, manifest)
        if changed:
            plan_files.append(changed)
            log(f"{name}: {manifest['plan']} is now saved up to lesson {manifest['planIndex']}")
        saved += 1
        removed.append(name)

    if removed and not dry_run:
        for name in removed:
            git(clone, "rm", "-r", "-q", "--", f"lessons/{name}")
        for changed in plan_files:
            git(clone, "add", "--", changed)
        identity = []
        if not git(clone, "config", "user.email", check=False).stdout.strip():
            identity = ["-c", "user.name=Lesson resources", "-c", "user.email=lesson-resources@users.noreply.github.com"]
        subprocess.run(["git", "-C", str(clone), *identity, "commit", "-q", "-m",
                        f"Saved {len(removed)} lesson(s) on the teacher's computer"], capture_output=True, text=True)
        pushed = git(clone, "push", "-q", "origin", f"HEAD:refs/heads/{branch}", check=False)
        if pushed.returncode != 0:
            git(clone, "pull", "--rebase", "-q", "origin", branch, check=False)
            pushed = git(clone, "push", "-q", "origin", f"HEAD:refs/heads/{branch}", check=False)
        if pushed.returncode != 0:
            log("the letterbox could not be updated; the saved lessons are recorded and will be cleared next login")
    if saved:
        wake_onedrive()
    return 0


# -------------------------------------------------------------------- install

def launcher_python() -> str:
    exe = Path(sys.executable)
    windowless = exe.with_name("pythonw.exe")
    return str(windowless if sys.platform == "win32" and windowless.is_file() else exe)


def filer_copy_dir() -> Path:
    return home() / "filer"


def copy_filer() -> Path:
    target = filer_copy_dir()
    target.mkdir(parents=True, exist_ok=True)
    for name in plugin_settings.FILER_FILES:
        shutil.copy2(HERE / name, target / name)
    return target / "letterbox_filer.py"


def register_at_login(script: Path) -> str:
    """How the filer was set to run at login, or '' when it could not be."""
    python = launcher_python()
    if sys.platform == "win32":
        # A task for this user at logon, which needs no administrator rights on
        # most computers; the Startup folder is the fallback that always does.
        command = (
            f"$a = New-ScheduledTaskAction -Execute '{python}' -Argument '\"{script}\" run';"
            f"$t = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME;"
            f"$s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30);"
            f"Register-ScheduledTask -TaskName '{TASK_NAME}' -Action $a -Trigger $t -Settings $s -Force | Out-Null"
        )
        shell = shutil.which("pwsh") or shutil.which("powershell") or "powershell"
        result = subprocess.run([shell, "-NoProfile", "-Command", command], capture_output=True, text=True)
        if result.returncode == 0:
            return "task"
        startup = Path(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
        if startup.is_dir():
            (startup / STARTUP_FILE).write_text(f'@start "" "{python}" "{script}" run\r\n', encoding="utf-8")
            return "startup"
        return ""
    return ""


def unregister() -> None:
    if sys.platform == "win32":
        shell = shutil.which("pwsh") or shutil.which("powershell") or "powershell"
        subprocess.run([shell, "-NoProfile", "-Command",
                        f"Unregister-ScheduledTask -TaskName '{TASK_NAME}' -Confirm:$false -ErrorAction SilentlyContinue"],
                       capture_output=True, text=True)
        startup = Path(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup", STARTUP_FILE)
        if startup.is_file():
            startup.unlink()


def install(repo: str, branch: str) -> int:
    if not shutil.which("git"):
        print("LETTERBOX_ERROR: git is not installed on this computer, and the letterbox is a git repository")
        return 1
    url = repo if ("://" in repo or repo.startswith("git@") or Path(repo).exists()) else f"https://github.com/{repo.removesuffix('.git')}.git"
    clone = home() / "letterbox"
    if not (clone / ".git").exists():
        home().mkdir(parents=True, exist_ok=True)
        cloned = subprocess.run(["git", *plugin_settings.letterbox_git_args(), "clone", "-q", url, str(clone)], capture_output=True, text=True)
        if cloned.returncode != 0:
            print(f"LETTERBOX_ERROR: the letterbox could not be cloned ({cloned.stderr.strip()}). "
                  "If it is private, this computer must be signed in to GitHub first.")
            return 1
    script = copy_filer()
    how = register_at_login(script)
    plugin_settings.write_settings({"letterbox": {
        "repo": url, "clone": str(clone), "branch": branch, "launcher": how, "python": launcher_python(),
    }})
    print(f"LETTERBOX_INSTALLED: {clone} on {branch}")
    if how:
        print(f"LETTERBOX_AT_LOGIN={how}")
    else:
        print("LETTERBOX_AT_LOGIN=none: it could not be set to run at login on this computer; "
              f"run \"{sys.executable}\" \"{script}\" run to collect lessons by hand")
    return 0


def status() -> int:
    settings = letterbox_settings()
    print(f"LETTERBOX_CLONE={settings.get('clone', '')}")
    print(f"LETTERBOX_BRANCH={settings.get('branch', '')}")
    print(f"LETTERBOX_AT_LOGIN={settings.get('launcher', '')}")
    try:
        for line in (home() / "letterbox.log").read_text(encoding="utf-8").splitlines()[-5:]:
            print(f"LOG: {line}")
    except OSError:
        pass
    return 0


def uninstall() -> int:
    unregister()
    plugin_settings.write_settings({"letterbox": {"clone": "", "launcher": ""}})
    print("LETTERBOX_UNINSTALLED: lessons are no longer collected at login; the clone is left in place")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Collect lessons built in the cloud.")
    sub = parser.add_subparsers(dest="command", required=True)
    install_cmd = sub.add_parser("install")
    install_cmd.add_argument("--repo", required=True)
    install_cmd.add_argument("--branch", default=plugin_settings.DEFAULT_LETTERBOX_BRANCH)
    run_cmd = sub.add_parser("run")
    run_cmd.add_argument("--dry-run", action="store_true")
    sub.add_parser("status")
    sub.add_parser("uninstall")
    args = parser.parse_args(argv)
    if args.command == "install":
        return install(args.repo, args.branch)
    if args.command == "run":
        try:
            return run(dry_run=args.dry_run)
        except Exception as exc:  # an unattended task must leave a trace, not a stack in nowhere
            log(f"ERROR: {exc}")
            return 1
    if args.command == "status":
        return status()
    return uninstall()


if __name__ == "__main__":
    raise SystemExit(main())
