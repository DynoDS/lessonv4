"""The Codex bridge keeps calls made together apart.

On 17 October 2026 a picture scout started four Codex calls at once with one
mistyped `--run-dir`. Each call wrote its record of which Codex session it was
into the same file, so all four read back the last one and reported the same
picture as theirs. The scout caught it by looking. The bridge now makes a fresh
folder for every call inside whatever folder it is given.
"""
from __future__ import annotations

import importlib.util
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / "codex-imagegen.py"


def load():
    spec = importlib.util.spec_from_file_location("codex_imagegen", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CallsMadeTogetherTests(unittest.TestCase):
    def test_four_calls_given_one_folder_each_find_their_own_picture(self):
        module = load()
        with tempfile.TemporaryDirectory() as home, tempfile.TemporaryDirectory() as work:
            images = Path(home) / "generated_images"
            count = {"n": 0}
            lock = threading.Lock()

            def fake_codex(command, input, stdout, **_kwargs):
                # A real call takes about a minute, so all four are writing
                # their records while the others are still running.
                with lock:
                    count["n"] += 1
                    thread = f"thread-{count['n']}"
                stdout.write(json.dumps({"type": "thread.started", "thread_id": thread}) + "\n")
                stdout.flush()
                time.sleep(0.3)
                folder = images / thread
                folder.mkdir(parents=True)
                (folder / "picture.png").write_bytes(thread.encode())
                return mock.Mock(returncode=0)

            prompts = []
            for n in range(4):
                prompt = Path(work) / f"prompt-{n}.txt"
                prompt.write_text(f"picture {n}", encoding="utf-8")
                prompts.append(prompt)

            answers: list[dict] = []

            def call(prompt):
                args = mock.Mock(prompt_file=str(prompt), run_dir=str(Path(work) / "codex"),
                                 base_image=None)
                module.cmd_generate(args)

            def emit(value, code=0):
                answers.append(value)
                return code

            with mock.patch.dict(os.environ, {"CODEX_HOME": home}), \
                    mock.patch.object(module, "find_codex", return_value="codex"), \
                    mock.patch.object(module, "emit", side_effect=emit), \
                    mock.patch.object(module.subprocess, "run", side_effect=fake_codex):
                workers = [threading.Thread(target=call, args=(p,)) for p in prompts]
                for worker in workers:
                    worker.start()
                for worker in workers:
                    worker.join()

            self.assertEqual(len(answers), 4)
            self.assertTrue(all(answer["ok"] for answer in answers), answers)
            self.assertEqual(len({answer["host_file"] for answer in answers}), 4)
            self.assertEqual(len({answer["run_dir"] for answer in answers}), 4)
            for answer in answers:
                self.assertEqual(Path(answer["run_dir"]).parent, Path(work) / "codex")


if __name__ == "__main__":
    unittest.main()
