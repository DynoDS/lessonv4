"""Every command the run is handed in full must be one its script accepts.

A step that describes its command in words ("run verify with the prepared
preflight, reference, view and review") leaves the coordinator to look it up:
of 29 Claude Code runs that reached the design review's postflight by
17 October 2026, 25 ran `verify --help` or hit a usage error first, a turn of
its own each time with the help text left in the context for the rest of the
run. So the run's commands are printed whole, and a printed command is only
worth printing if it parses. This check pulls every Python command printed in
the make-lesson skill, its runtime slices, the agent files and the references,
fills the placeholders with harmless values, and hands each to its own script's
argument parser without running the script. Two printed commands once carried a
literal backslash-n where a line break was meant (argparse: "unrecognized
arguments: n n n"); every worker rewrote them by hand, and this is what catches
the next one.

A line of its own in square brackets inside a command is one of two things. A
bracketed option (`[--adaptation-accepted]`, `[--day "[DAY]"]`) is optional and
is checked as if given. Bracketed prose (`[one --file per resource]`) tells the
reader what to repeat or add and is left out.
"""

from __future__ import annotations

import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
RUNTIME = SCRIPTS / "make-lesson-runtime.py"

# Scripts that read their own arguments without argparse, so there is no parser
# to hand a command to without running it. The runtime slicer's commands are
# checked against its own slice table instead; the rest are named here so a new
# hand-read script is noticed rather than skipped in silence.
HAND_READ = {
    "resolve-filing.py": "reads year, subject and its flags by hand",
    "validate-lesson-design.py": "reads its files and flags by hand",
    "lesson-settings.py": "reads its verb and values by hand",
    "verify-plugin-root.py": "reads its candidate root and --find-source by hand",
    "do-beats-in-a-row.py": "reads the design path by hand",
    "lesson-batch.py": "reads its verb and flags by hand",
}

# Commands still described rather than printed, each with why. A fallback the
# reader fills from its spawn prompt, left as it is for now because printing it
# whole would take the wall designer past its own size limit (17 October 2026).
DESCRIBED_ON_PURPOSE = {
    ("agents/working-wall-designer.md", "working-wall-packet.py", "prepare"),
}

PYTHON_TOKEN =re.compile(r'^"?(?:\[PYTHON\]|<PYTHON>|python3?)"?\s+')
SCRIPT_TOKEN = re.compile(r'^"?[^"\s]*/scripts/([\w\-]+\.py)"?(?=\s|$)')
INLINE = re.compile(r'`("?(?:\[PYTHON\]|<PYTHON>|python3?)"?\s[^`]+)`')
OPTIONAL_GROUP = re.compile(r"\[(--[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]")
PLACEHOLDER = re.compile(r"\[[^\[\]]*\]|<[^<>\s][^<>]*>")
CONDITION = re.compile(r"\s+(?:when|if|only|unless|per|for)\s.*$")
SHELL_STOPS = {"|", "||", "&&", ";", ">", ">>", "2>&1", "2>/dev/null", "1>&2"}

# Placeholders a parser reads as numbers.
NUMERIC = {"[INDEX]", "[N]", "[YEAR]", "[WEEK_NUM]", "[ATTEMPT]", "<index>", "<N>"}

HARNESS = r'''
import argparse, os, runpy, sys
script = sys.argv[1]
sys.argv = [script] + sys.argv[2:]
state = {"depth": 0, "in_parse_args": False}
original_known = argparse.ArgumentParser.parse_known_args
original_args = argparse.ArgumentParser.parse_args
def parsed():
    sys.stdout.write("PRINTED_COMMAND_PARSED\n")
    sys.stdout.flush()
    os._exit(0)
def parse_known_args(self, *a, **k):
    state["depth"] += 1
    try:
        result = original_known(self, *a, **k)
    finally:
        state["depth"] -= 1
    if state["depth"] == 0 and not state["in_parse_args"]:
        parsed()
    return result
def parse_args(self, *a, **k):
    state["in_parse_args"] = True
    original_args(self, *a, **k)
    parsed()
argparse.ArgumentParser.parse_known_args = parse_known_args
argparse.ArgumentParser.parse_args = parse_args
sys.path.insert(0, os.path.dirname(script))
runpy.run_path(script, run_name="__main__")
sys.stdout.write("PRINTED_COMMAND_NEVER_PARSED\n")
'''


def source_texts(root: Path) -> list[tuple[str, str]]:
    """The model-facing files a run reads, and every runtime slice it loads."""
    texts: list[tuple[str, str]] = []
    for folder in ("skills", "agents", "references"):
        for path in sorted((root / folder).rglob("*.md")):
            # The build log quotes old commands as history; it is not handed to a run.
            if path.name == "build-review-log.md":
                continue
            texts.append((str(path.relative_to(root)), path.read_text(encoding="utf-8")))
    runtime = root / "scripts" / "make-lesson-runtime.py"
    for name in slice_names(runtime):
        completed = subprocess.run(
            [sys.executable, "-X", "utf8", str(runtime), "--slice", name],
            capture_output=True,
            check=True,
        )
        texts.append((f"slice {name}", completed.stdout.decode("utf-8")))
    return texts


def slice_names(runtime: Path) -> list[str]:
    text = runtime.read_text(encoding="utf-8")
    table = text[text.index("SLICE_BOUNDS"): text.index("NEXT_STEPS")]
    return re.findall(r'^    "([\w\-]+)": \(', table, flags=re.M)


def printed_commands(text: str) -> list[str]:
    """Each printed Python command, its continuation lines joined."""
    commands: list[str] = []
    text = text.replace("\r\n", "\n")
    in_fence = False
    lines = text.split("\n")
    index = 0
    while index < len(lines):
        line = lines[index]
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            index += 1
            continue
        if in_fence and PYTHON_TOKEN.match(line.strip()):
            parts = [line.strip()]
            while parts[-1].endswith("\\") and index + 1 < len(lines):
                index += 1
                parts.append(lines[index].strip())
            commands.append("\n".join(parts))
        elif not in_fence:
            commands.extend(match.group(1) for match in INLINE.finditer(line))
        index += 1
    return commands


def fill(placeholder: str, scratch: Path) -> str:
    """A harmless value: the first of `[ready|unavailable]`, a number for an
    index, a scratch path for anything else."""
    inner = placeholder[1:-1]
    if "|" in inner and " " not in inner:
        return inner.split("|")[0]
    if placeholder in NUMERIC:
        return "1"
    return (scratch / "x").as_posix()


def to_argv(command: str, plugin_root: Path, scratch: Path) -> tuple[str, list[str]] | None:
    """The script name and the argument list a shell would hand it, or None
    when the command is not a plugin script (`-c`, a node builder)."""
    kept: list[str] = []
    for raw in command.split("\n"):
        piece = raw.strip()
        if piece.endswith("\\"):
            piece = piece[:-1].rstrip()
        if piece.startswith("[") and piece.endswith("]") and not OPTIONAL_GROUP.fullmatch(piece):
            if not PYTHON_TOKEN.match(piece):
                continue  # bracketed prose: what to repeat or add
        kept.append(piece)
    flat = " ".join(kept)
    flat = PYTHON_TOKEN.sub("", flat, count=1)
    while flat.startswith("-"):
        # interpreter flags such as -X utf8 or -I
        flag, _, rest = flat.partition(" ")
        if flag == "-c":
            return None
        if flag == "-X":
            rest = rest.partition(" ")[2]
        flat = rest.lstrip()
    match = SCRIPT_TOKEN.match(flat)
    if not match:
        return None
    script = match.group(1)
    flat = flat[match.end():]
    # An optional option may carry its condition in prose after it
    # (`[--early-wave-snapshot "..." when the early wave compiled]`).
    flat = OPTIONAL_GROUP.sub(lambda m: CONDITION.sub("", m.group(1)), flat)
    for token in ("[PLUGIN_ROOT]", "<PLUGIN_ROOT>", "[PLUGIN_SOURCE_ROOT]", "[PLUGIN_ROOT_CANDIDATE]"):
        flat = flat.replace(token, plugin_root.as_posix())
    flat = PLACEHOLDER.sub(lambda m: fill(m.group(0), scratch), flat)
    argv: list[str] = []
    for token in shlex.split(flat, posix=True):
        if token in SHELL_STOPS:
            break
        # `...` is either a value left to the reader or "and so on".
        argv.append((scratch / "x").as_posix() if token == "..." else token)
    return script, argv


def check_command(script: str, argv: list[str], plugin_root: Path, scratch: Path) -> str | None:
    """None when the script's parser accepts the arguments; else the reason."""
    path = plugin_root / "scripts" / script
    if not path.is_file():
        return f"no such script {script}"
    if script == "make-lesson-runtime.py":
        names = slice_names(path)
        # `--slice "[SLICE]"` leaves the name to the reader.
        if len(argv) != 2 or argv[0] != "--slice" or argv[1] not in [*names, (scratch / "x").as_posix()]:
            return f"make-lesson-runtime.py takes --slice <one of {names}>, got {argv}"
        return None
    if "argparse" not in path.read_text(encoding="utf-8"):
        if script in HAND_READ:
            return None
        return f"{script} has no argparse parser to check against: name it in HAND_READ"
    filler = (scratch / "x").as_posix()
    argv = list(argv)
    # A placeholder standing where the parser wants a choice or a number is the
    # reader's to fill; give it the first value the parser offers and ask again.
    for _ in range(6):
        completed = subprocess.run(
            [sys.executable, "-X", "utf8", "-c", HARNESS, str(path), *argv],
            capture_output=True,
            cwd=scratch,
            timeout=120,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
        out = completed.stdout.decode("utf-8", "replace")
        if "PRINTED_COMMAND_PARSED" in out and completed.returncode == 0:
            return None
        err = completed.stderr.decode("utf-8", "replace")
        choice = re.search(r"invalid choice: '([^']*)' \(choose from ([^)]*)\)", err)
        number = re.search(r"invalid (?:int|float) value: '([^']*)'", err)
        if choice and choice.group(1) == filler:
            first = choice.group(2).split(",")[0].strip().strip("'")
            argv[argv.index(filler)] = first
            continue
        if number and number.group(1) == filler:
            argv[argv.index(filler)] = "1"
            continue
        # `[--role [role] ...]`: a trailing `...` means "and so on", not a value.
        extra = re.search(r"unrecognized arguments: (.*)", err)
        if extra and set(extra.group(1).split()) == {filler} and argv and argv[-1] == filler:
            argv.pop()
            continue
        break
    lines = err.strip().splitlines()
    return " | ".join(lines[-3:]) or out.strip()[-300:] or f"exit {completed.returncode}"


def failures_under(plugin_root: Path) -> tuple[int, list[str]]:
    """How many printed commands were checked, and each that does not parse."""
    scratch = Path(tempfile.mkdtemp(prefix="printed-commands-"))
    try:
        jobs: dict[tuple[str, tuple[str, ...]], list[str]] = {}
        for where, text in source_texts(plugin_root):
            for command in printed_commands(text):
                parsed = to_argv(command, plugin_root, scratch)
                if parsed is None:
                    continue
                script, argv = parsed
                if (where.replace("\\", "/"), script, argv[0] if argv else "") in DESCRIBED_ON_PURPOSE:
                    continue
                jobs.setdefault((script, tuple(argv)), []).append(f"{where}: {command.splitlines()[0][:90]}")
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda key: check_command(key[0], list(key[1]), plugin_root, scratch), jobs))
        failures = [
            f"{places[0]} ({len(places)} place(s)): {reason}"
            for (key, places), reason in zip(jobs.items(), results)
            if reason is not None
        ]
        return len(jobs), failures
    finally:
        shutil.rmtree(scratch, ignore_errors=True)


class PrintedCommandsParse(unittest.TestCase):
    def test_every_printed_command_parses(self) -> None:
        checked, failures = failures_under(ROOT)
        # A floor, so an extractor that silently finds nothing cannot pass.
        self.assertGreater(checked, 60, "too few printed commands were found to check")
        self.assertEqual(failures, [], "\n".join(failures))

    def test_the_commands_the_run_used_to_look_up_are_printed(self) -> None:
        """The steps that cost a help lookup in most runs, each printed whole."""
        texts = "\n".join(text for _, text in source_texts(ROOT))
        commands = [c for c in printed_commands(texts)]
        for script, verb in (
            ("design-review-packet.py", "verify"),
            ("photo-contract.py", "select-worksheet"),
            ("run-fixed-resource.py", "deliver"),
            ("validate-image-scout.py", "result"),
            ("finalize-picture-assignment.py", "assignment"),
            ("plan-tracker.py", "next"),
            ("plan-tracker.py", "advance"),
        ):
            with self.subTest(script=script, verb=verb):
                self.assertTrue(
                    any(f"/scripts/{script}" in c and re.search(rf"\s{re.escape(verb)}(\s|$)", c) for c in commands),
                    f"{script} {verb} is described, not printed",
                )

    def test_a_broken_command_is_caught(self) -> None:
        """The check fails for the intended reason on a deliberately broken copy."""
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / "plugin"
            os.makedirs(copy / "skills" / "make-lesson")
            os.makedirs(copy / "agents")
            os.makedirs(copy / "references")
            shutil.copytree(ROOT / "scripts", copy / "scripts", ignore=shutil.ignore_patterns("tests", "__pycache__"))
            playbook = (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
            (copy / "skills" / "make-lesson" / "playbook-lite.md").write_text(playbook, encoding="utf-8")
            healthy_count, healthy = failures_under(copy)
            self.assertEqual(healthy, [], "\n".join(healthy))

            wall = '--working-dir "[WORKING_DIR]" \\\n  --working-wall'
            self.assertIn(wall, playbook)
            # The 4.2.324 fault: a literal backslash-n where a line break was meant.
            broken = playbook.replace(wall, '--working-dir "[WORKING_DIR]" \\n  --working-wall', 1)
            # And an argument name the script does not have (not a prefix of a
            # real one, which argparse would accept as an abbreviation).
            broken = broken.replace('--review "[WORKING_DIR]/design-review.md"', '--reviewed "[WORKING_DIR]/design-review.md"', 1)
            (copy / "skills" / "make-lesson" / "playbook-lite.md").write_text(broken, encoding="utf-8")
            _, failures = failures_under(copy)
            joined = "\n".join(failures)
            self.assertTrue(any("working-wall-packet.py" in f and "unrecognized arguments" in f for f in failures), joined)
            self.assertTrue(any("design-review-packet.py" in f for f in failures), joined)


if __name__ == "__main__":
    unittest.main()
