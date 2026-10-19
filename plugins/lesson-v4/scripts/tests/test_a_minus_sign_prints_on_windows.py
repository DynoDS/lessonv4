"""A script whose output is piped prints the lesson's own characters, on Windows too.

On 18 October 2026 the slide preview crashed on its first run in all five
lessons of the Year 4 subtraction week: the check's note quoted "52 − 28", the
preview passed it on, and a piped Windows console in cp1252 has no minus sign.
The set's progress watcher crashed the same way and a lesson's finished line was
lost. Each worker reran with PYTHONIOENCODING=utf-8. Now every runnable script
switches its own output to UTF-8 first (scripts/utf8_output.py).

PYTHONIOENCODING=cp1252 below stands in for that console on any computer.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import test_lesson_batch as batch_tests

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
FIT = ROOT / "builder" / "scripts" / "fit_text_postprocess.py"
SUM = "52 − 28"
CP1252 = {**os.environ, "PYTHONIOENCODING": "cp1252"}


def piped(command: list[str], env: dict) -> subprocess.CompletedProcess:
    return subprocess.run(command, capture_output=True, env=env, timeout=120)


class EveryScriptSwitchesItsOwnOutput(unittest.TestCase):
    def test_every_runnable_script_turns_the_switch_on_before_it_runs(self):
        missing = []
        runnable = 0
        for path in sorted(SCRIPTS.glob("*.py")):
            source = path.read_text(encoding="utf-8")
            start = re.search(r'^if __name__ == "__main__":\n((?:[ \t]+.*\n?)+)', source, re.M)
            if not start:
                continue
            runnable += 1
            block = start.group(1).splitlines()
            if block[:2] != ["    import utf8_output", "    utf8_output.enable()"]:
                missing.append(path.name)
        self.assertGreater(runnable, 40)
        self.assertEqual(missing, [], "these scripts print without the UTF-8 switch")

    def test_the_builders_own_python_step_has_it_too(self):
        start = FIT.read_text(encoding="utf-8").split('if __name__ == "__main__":', 1)[1]
        self.assertIn('reconfigure(encoding="utf-8", errors="replace")', start.split("main()")[0])

    def test_the_switch_prints_a_minus_sign_through_a_cp1252_pipe(self):
        code = f"import utf8_output; utf8_output.enable(); print({SUM!r})"
        out = piped([sys.executable, "-c", code], {**CP1252, "PYTHONPATH": str(SCRIPTS)})
        self.assertEqual(out.returncode, 0, out.stderr.decode("utf-8", "replace"))
        self.assertEqual(out.stdout.decode("utf-8").strip(), SUM)


class TheTwoThatCrashedOnTheMathsWeek(unittest.TestCase):
    def test_the_watcher_passes_on_a_step_with_a_minus_sign(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, batch, output, env = batch_tests.plan(tmp, [batch_tests.lesson("a"), batch_tests.lesson("b")])
            for lesson in batch["lessons"]:
                lesson.update(status="building", pid=0)
            folder = output / "working" / "lesson-batch"
            (folder / "batch.json").write_text(json.dumps(batch), encoding="utf-8")
            (folder / "events.log").write_text(f"STEP a: Modelling {SUM}.\nFINISHED b\n", encoding="utf-8")
            out = piped([sys.executable, str(SCRIPTS / "lesson-batch.py"), "watch",
                         "--output", str(output), "--max-minutes", "0"], {**env, "PYTHONIOENCODING": "cp1252"})
            text = out.stdout.decode("utf-8")
            self.assertEqual(out.returncode, 0, out.stderr.decode("utf-8", "replace"))
            self.assertIn(f"STEP a: Modelling {SUM}.", text)
            self.assertIn("FINISHED b", text)

    def test_the_preview_passes_on_a_check_note_with_a_minus_sign(self):
        """A stand-in for node prints the note the real check printed, then fails."""
        with tempfile.TemporaryDirectory() as tmp:
            bin_dir = Path(tmp)
            fake = bin_dir / "fake_check.py"
            fake.write_text(
                "import sys\n"
                f"sys.stdout.buffer.write('[warn] slide 4: {SUM} drawn smaller\\n'.encode('utf-8'))\n"
                "sys.exit(3)\n", encoding="utf-8")
            if os.name == "nt":
                (bin_dir / "node.cmd").write_text(f'@"{sys.executable}" "{fake}" %*\r\n', encoding="utf-8")
            else:
                node = bin_dir / "node"
                node.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{fake}" "$@"\n', encoding="utf-8")
                node.chmod(0o755)
            env = {**CP1252, "PATH": str(bin_dir) + os.pathsep + os.environ.get("PATH", "")}
            out = piped([sys.executable, str(SCRIPTS / "preview-deck.py"),
                         "--candidate", str(bin_dir / "lesson.json"),
                         "--photo-requirements", str(bin_dir / "photo-requirements.json")], env)
            text = out.stdout.decode("utf-8")
            self.assertNotIn("UnicodeEncodeError", out.stderr.decode("utf-8", "replace"))
            self.assertIn(f"slide 4: {SUM} drawn smaller", text)
            self.assertIn("DECK_PREVIEW_STOPPED: the preview check exited 3", text)


if __name__ == "__main__":
    unittest.main()
