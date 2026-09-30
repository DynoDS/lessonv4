"""Run every automatic check the plugin has, side by side, and print one line per group.

The groups are the Python checks in this folder, the teacher-voice harness, and
the Node checks of the slide builder, the worksheet, stick-in and wall engines,
the shared drawings (`shared/test` and `shared/text`) and the plugin root's own
`test/`. They all start at once; the Python checks, the slowest group, are split
into small batches that the next free lane picks up, so no lane waits on
another. Splitting changes only how long the run takes: every check still runs
once, on the same files.

Usage (from anywhere):
    python -X utf8 scripts/tests/run_all_checks.py [--lanes N] [--batch N] [--logs DIR]

Each group's full output is kept in the log folder (a temporary one unless
`--logs` names it) and the failures are printed under the summary. Exit 0 means
every group passed; exit 1 means at least one check failed or a group did not run.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TESTS = Path(__file__).resolve().parent

GIT_LOCATORS = {"GIT_INDEX_FILE", "GIT_DIR", "GIT_WORK_TREE", "GIT_PREFIX", "GIT_COMMON_DIR",
                "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES"}

# Name, working folder, command. Node expands the quoted file patterns itself.
NODE_GROUPS = [
    ("builder", ROOT / "builder", ["node", "--test", "test/*.test.js"]),
    ("worksheet", ROOT / "worksheet-html", ["node", "--test"]),
    ("stick-in", ROOT / "stick-in-sheets-html", ["node", "--test"]),
    ("wall", ROOT / "working-wall-html", ["node", "--test"]),
    ("shared", ROOT, ["node", "--test", "shared/test/*.test.js", "shared/text/*.test.js"]),
    ("root", ROOT, ["node", "--test", "test/*.test.js"]),
]


def python_batches(size: int) -> list[list[str]]:
    """The Python check files in small batches, largest first. Lanes take the
    next batch as each one finishes, so a slow file never holds up a queue."""
    files = sorted(TESTS.glob("test_*.py"), key=lambda path: path.stat().st_size, reverse=True)
    return [[str(path) for path in files[i:i + size]] for i in range(0, len(files), size)]


def python_totals(text: str) -> tuple[int, int]:
    """Passed and failed counts from pytest's closing line (errors count as failures)."""
    lines = [line for line in text.splitlines() if re.search(r" in [\d.]+s", line)]
    last = lines[-1] if lines else ""
    passed = sum(int(n) for n in re.findall(r"(\d+) passed", last))
    failed = sum(int(n) for n in re.findall(r"(\d+) (?:failed|errors?)\b", last))
    return passed, failed


def node_totals(text: str) -> tuple[int, int]:
    passed = re.findall(r"^\S* ?pass (\d+)$", text, re.M)
    failed = re.findall(r"^\S* ?fail (\d+)$", text, re.M)
    return (int(passed[-1]) if passed else 0), (int(failed[-1]) if failed else 0)


def failures(name: str, text: str) -> list[str]:
    if name.startswith("python") or name == "voice":
        return [line for line in text.splitlines() if re.match(r"(SUB)?FAILED|ERROR ", line)]
    return [line.strip() for line in text.splitlines() if re.match(r"^\s*not ok ", line)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--lanes", type=int, default=min(8, os.cpu_count() or 4),
                        help="how many Python batches run at once (default: up to 8)")
    parser.add_argument("--batch", type=int, default=3, help="Python check files per batch (default 3)")
    parser.add_argument("--logs", type=Path, help="folder for each group's full output")
    args = parser.parse_args()

    logs = args.logs or Path(tempfile.mkdtemp(prefix="lesson-v4-checks-"))
    logs.mkdir(parents=True, exist_ok=True)
    # Run from a git hook, the environment names the commit's own index and
    # repository; checks that run git in folders of their own must not see it.
    env = {key: value for key, value in os.environ.items()
           if key not in GIT_LOCATORS}
    env["PYTHONUTF8"] = "1"
    python = [sys.executable, "-X", "utf8", "-m", "pytest", "-q", "-p", "no:cacheprovider", "-rfE"]

    # The tap reporter prints one "not ok" line per failure and plain totals.
    fixed = [("voice", ROOT, python + ["evals/teacher-voice"])]
    fixed += [(name, folder, command[:2] + ["--test-reporter=tap"] + command[2:])
              for name, folder, command in NODE_GROUPS]
    waiting = [(f"python {n}", ROOT, python + batch)
               for n, batch in enumerate(python_batches(args.batch), start=1)]

    started = time.monotonic()
    running: list[tuple] = []
    done: list[tuple] = []

    def launch(name: str, folder: Path, command: list[str]) -> None:
        log = open(logs / f"{name.replace(' ', '-')}.log", "w", encoding="utf-8")
        process = subprocess.Popen(command, cwd=folder, stdout=log, stderr=subprocess.STDOUT, env=env)
        running.append((name, process, log, time.monotonic()))

    for job in fixed:
        launch(*job)
    while waiting or running:
        busy = sum(1 for name, *_ in running if name.startswith("python"))
        while waiting and busy < args.lanes:
            launch(*waiting.pop(0))
            busy += 1
        for entry in list(running):
            name, process, log, began = entry
            if process.poll() is not None:
                log.close()
                running.remove(entry)
                done.append((name, process.returncode, began, time.monotonic()))
        time.sleep(0.1)

    results = []
    for name, code, began, ended in done:
        text = (logs / f"{name.replace(' ', '-')}.log").read_text(encoding="utf-8", errors="replace")
        totals = python_totals(text) if name.startswith("python") or name == "voice" else node_totals(text)
        results.append((name, code, *totals, began, ended, failures(name, text)))

    python_rows = [row for row in results if row[0].startswith("python")]
    rows = [("python", max(r[1] for r in python_rows), sum(r[2] for r in python_rows),
             sum(r[3] for r in python_rows), max(r[5] for r in python_rows) - started,
             [line for r in python_rows for line in r[6]])]
    order = ["voice"] + [name for name, *_ in NODE_GROUPS]
    rows += sorted(((r[0], r[1], r[2], r[3], r[5] - r[4], r[6]) for r in results if not r[0].startswith("python")),
                   key=lambda row: order.index(row[0]))

    ok = True
    for name, code, passed, failed, seconds, _ in rows:
        broken = code != 0 or failed > 0 or passed == 0
        ok = ok and not broken
        status = "FAILED" if broken else "ok"
        print(f"{name:<10} {status:<7} {passed:>5} passed  {failed:>3} failed  {seconds:6.1f}s")
    print(f"{'all':<10} {'ok' if ok else 'FAILED':<7} in {time.monotonic() - started:.1f}s  (logs: {logs})")
    for name, *_, lines in rows:
        for line in lines:
            print(f"  {name}: {line[:220]}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
