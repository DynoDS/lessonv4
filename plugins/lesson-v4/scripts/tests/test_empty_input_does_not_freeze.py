"""A command that hands Python empty input finishes instead of freezing.

In Git Bash on Windows an empty here-block (`python3 - <<'EOF'` with nothing
before `EOF`) or `< /dev/null` reaches Python as the NUL device, which Windows
reports as a console. Python 3.13's new interactive prompt then fails to size
that console and retries forever. Between 1 and 17 October 2026 this froze 27
commands until the tool's time limit stopped them, among them the lesson 31
decorator for 400 seconds in the 15 October five-lesson round. Python 3.12,
and 3.13 with PYTHON_BASIC_REPL=1, read end of input and exit.

The plugin's Claude Code start-up step writes that setting into the session's
environment file, which Claude Code runs before every shell command, workers
included. Five more froze on `cat > file` with nothing piped in, which no
setting reaches, so the worker scratch line says it.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HOOKS = ROOT / "hooks" / "hooks.json"
SCRIPT = ROOT / "scripts" / "session-env.js"
SKILL = ROOT / "skills" / "make-lesson" / "SKILL.md"
HELPER_ROUTE = ROOT / "references" / "helper-route.md"
LINE = "export PYTHON_BASIC_REPL=1"


def run_script(env_file: str | None) -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if k != "CLAUDE_ENV_FILE"}
    if env_file is not None:
        env["CLAUDE_ENV_FILE"] = env_file
    return subprocess.run(["node", str(SCRIPT)], env=env, capture_output=True,
                          text=True, timeout=30)


class EmptyInputDoesNotFreeze(unittest.TestCase):
    def test_start_up_step_runs_the_script(self):
        hooks = json.loads(HOOKS.read_text(encoding="utf-8"))["hooks"]
        commands = [h["command"] for group in hooks["SessionStart"] for h in group["hooks"]]
        root_token = "${" + "CLAUDE_PLUGIN_ROOT}"
        self.assertEqual(commands, [f'node "{root_token}/scripts/session-env.js"'])

    def test_setting_is_written_once_and_keeps_other_lines(self):
        with tempfile.TemporaryDirectory() as tmp:
            env_file = Path(tmp) / "env.sh"
            env_file.write_text("export OTHER=1", encoding="utf-8")
            for _ in range(2):
                self.assertEqual(run_script(str(env_file)).returncode, 0)
            lines = env_file.read_text(encoding="utf-8").splitlines()
            self.assertEqual(lines, ["export OTHER=1", LINE])

    def test_outside_claude_code_it_does_nothing(self):
        result = run_script(None)
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, "", ""))

    def test_python_given_empty_input_finishes_with_the_setting(self):
        env = dict(os.environ, PYTHON_BASIC_REPL="1")
        result = subprocess.run([sys.executable, "-"], stdin=subprocess.DEVNULL,
                                capture_output=True, env=env, timeout=30)
        self.assertEqual(result.returncode, 0)

    def test_worker_scratch_lines_name_the_waiting_command(self):
        for path in (SKILL, HELPER_ROUTE):
            with self.subTest(file=path.name):
                self.assertIn("sits silently until the time limit stops it",
                              path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
