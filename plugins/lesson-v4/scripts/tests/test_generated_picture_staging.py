"""A generated picture is staged by a command, from the file the host saved.

On 6 October 2026 a Year 4 science run on Codex lost four essential pictures
that had all been drawn. The host had saved each one as a file; the workers
tried to move the picture as text instead, which is about a million characters:
printed it was cut short, and on a command line Windows refused it. Seven first
calls out of seven were recorded as returning nothing. `record-generated` now
finds the host's file itself, so the worker never handles the picture.
"""
from __future__ import annotations

import importlib.util
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


attempts = load("picture_attempts_staging", "image-scout-attempts.py")


class GeneratedPictureStagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.working = self.root / "working"
        self.working.mkdir()
        self.work_root = self.working / "unsplash" / "_picture-work" / "p1"
        self.host = self.root / "host" / "generated_images"
        self.session = self.host / "session-one"
        self.session.mkdir(parents=True)
        self.filename = "unsplash/one.jpg"

    def tearDown(self):
        self.temp.cleanup()

    def args(self, **values):
        defaults = {
            "working_dir": str(self.working), "filename": self.filename,
            "purpose": "initial", "prompt": "a prompt", "prompt_file": None,
            "attempt": 1, "staging_path": None, "work_root": str(self.work_root),
            "host_file": None, "host_dir": str(self.host), "reason": None,
        }
        defaults.update(values)
        return SimpleNamespace(**defaults)

    def ledger(self, filename=None) -> Path:
        return Path(attempts.ledger_path(str(self.working), filename or self.filename))

    def events(self, filename=None) -> list:
        return json.loads(self.ledger(filename).read_text(encoding="utf-8"))["events"]

    def state(self, filename=None) -> str:
        status = attempts.cmd_status(self.args(filename=filename or self.filename))
        return status["attempts"][-1]["state"]

    def host_image(self, name: str, content: bytes, age_seconds: float = 0) -> Path:
        path = self.session / name
        path.write_bytes(content)
        if age_seconds:
            reserved = self.events()[0]["reserved_at"]
            os.utime(path, (reserved - age_seconds, reserved - age_seconds))
        return path

    def test_the_file_the_host_wrote_since_the_reservation_is_staged_and_recorded(self):
        attempts.cmd_reserve(self.args())
        picture = self.host_image("exec-new.png", b"the first call's picture")

        result = attempts.cmd_record_generated(self.args())

        staged = Path(result["staging_path"])
        self.assertTrue(result["recorded"])
        self.assertEqual(staged, self.work_root / "ai" / "one.png")
        self.assertEqual(staged.read_bytes(), b"the first call's picture")
        self.assertEqual(Path(result["host_file"]), picture)
        self.assertEqual(self.state(), "generated_unreviewed")
        self.assertEqual(self.events()[-1]["host_file"], str(picture))
        # Saved, not judged: the call is still spent and still waits for review.
        status = attempts.cmd_status(self.args())
        self.assertEqual(status["attempts_used"], 1)
        self.assertIsNone(status["effective_accepted_attempt"])

    def test_nothing_new_in_the_host_folder_leaves_the_attempt_open(self):
        attempts.cmd_reserve(self.args())
        self.host_image("exec-yesterday.png", b"an older lesson's picture", age_seconds=600)
        (self.session / "notes.txt").write_text("not a picture", encoding="utf-8")
        before = self.ledger().read_bytes()

        result = attempts.cmd_record_generated(self.args())

        self.assertFalse(result["recorded"])
        self.assertIsNone(result["generated_unreviewed_attempt"])
        self.assertEqual(result["candidates"], [])
        self.assertIn("interrupt-open", result["note"])
        self.assertEqual(self.ledger().read_bytes(), before)
        self.assertEqual(self.state(), "open")
        self.assertFalse((self.work_root / "ai").exists())

    def test_two_candidates_are_both_offered_and_neither_is_recorded_until_one_is_named(self):
        other = "unsplash/two.jpg"
        attempts.cmd_reserve(self.args())
        attempts.cmd_reserve(self.args(filename=other))
        first = self.host_image("exec-aaa.png", b"picture for one")
        second = self.host_image("exec-bbb.png", b"picture for two")
        before = self.ledger().read_bytes()

        offered = attempts.cmd_record_generated(self.args())

        self.assertFalse(offered["recorded"])
        self.assertEqual(
            {Path(item["host_file"]) for item in offered["candidates"]}, {first, second}
        )
        self.assertIn("--host-file", offered["note"])
        self.assertEqual(self.ledger().read_bytes(), before)
        self.assertEqual(self.state(), "open")
        self.assertFalse((self.work_root / "ai").exists())

        named = attempts.cmd_record_generated(self.args(host_file=str(first)))
        self.assertTrue(named["recorded"])
        self.assertEqual(Path(named["staging_path"]).read_bytes(), b"picture for one")

        # The named file is spoken for, so the sibling entry has one candidate left.
        sibling = attempts.cmd_record_generated(self.args(filename=other))
        self.assertTrue(sibling["recorded"])
        self.assertEqual(Path(sibling["host_file"]), second)
        self.assertEqual(Path(sibling["staging_path"]).read_bytes(), b"picture for two")

    def test_one_host_file_is_never_recorded_for_two_pictures(self):
        other = "unsplash/two.jpg"
        attempts.cmd_reserve(self.args())
        attempts.cmd_reserve(self.args(filename=other))
        picture = self.host_image("exec-aaa.png", b"picture for one")
        attempts.cmd_record_generated(self.args(host_file=str(picture)))

        with self.assertRaises(attempts.LedgerError) as caught:
            attempts.cmd_record_generated(self.args(filename=other, host_file=str(picture)))
        self.assertIn(self.filename, str(caught.exception))
        self.assertEqual(self.state(other), "open")

    def test_a_named_file_older_than_the_reservation_is_not_this_calls_output(self):
        attempts.cmd_reserve(self.args())
        stale = self.host_image("exec-old.png", b"an earlier picture", age_seconds=600)
        before = self.ledger().read_bytes()

        with self.assertRaises(attempts.LedgerError):
            attempts.cmd_record_generated(self.args(host_file=str(stale)))
        self.assertEqual(self.ledger().read_bytes(), before)

    def test_a_host_with_no_generated_images_folder_says_so_and_changes_nothing(self):
        attempts.cmd_reserve(self.args())
        before = self.ledger().read_bytes()
        missing = self.root / "no-such-host" / "generated_images"

        result = attempts.cmd_record_generated(self.args(host_dir=str(missing)))

        self.assertFalse(result["recorded"])
        self.assertIsNone(result["host_folder"])
        self.assertIn("no generated-images folder", result["note"])
        self.assertIn("--staging-path", result["note"])
        self.assertEqual(self.ledger().read_bytes(), before)
        self.assertEqual(self.state(), "open")

    def test_a_ledger_reserved_before_times_were_kept_still_finds_its_file(self):
        attempts.cmd_reserve(self.args())
        data = json.loads(self.ledger().read_text(encoding="utf-8"))
        del data["events"][0]["reserved_at"]
        self.ledger().write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        self.host_image("exec-new.png", b"the picture")

        self.assertTrue(attempts.cmd_record_generated(self.args())["recorded"])

    def test_an_explicit_staging_path_records_exactly_as_before(self):
        attempts.cmd_reserve(self.args())
        self.host_image("exec-new.png", b"ignored: the worker staged its own file")
        own = self.root / "own.png"
        own.write_bytes(b"staged by the worker")

        result = attempts.cmd_record_generated(
            self.args(staging_path=str(own), work_root=None, host_dir=None)
        )

        self.assertEqual(
            result, {"generated_unreviewed_attempt": 1, "staging_path": str(own.resolve())}
        )
        self.assertEqual(
            self.events()[-1],
            {"event": "generated_unreviewed", "attempt": 1, "staging_path": str(own.resolve())},
        )

    def test_the_two_call_lifetime_is_untouched_by_a_staged_file(self):
        attempts.cmd_reserve(self.args())
        self.host_image("exec-one.png", b"first")
        attempts.cmd_record_generated(self.args())
        attempts.cmd_complete(self.args(
            outcome="near_miss", fault="one visible fault", fault_file=None, attempt=1,
        ))
        attempts.cmd_reserve(self.args(purpose="correction"))
        self.host_image("exec-two.png", b"second")

        second = attempts.cmd_record_generated(self.args(attempt=2))

        # The first call's file is kept beside the second, never overwritten.
        self.assertEqual(Path(second["staging_path"]).name, "one-attempt-2.png")
        self.assertEqual((self.work_root / "ai" / "one.png").read_bytes(), b"first")
        attempts.cmd_complete(self.args(
            outcome="rejected", fault="still wrong", fault_file=None, attempt=2,
        ))
        with self.assertRaises(attempts.LedgerError):
            attempts.cmd_reserve(self.args(purpose="recovery"))

    def test_the_command_line_takes_the_host_route_and_refuses_neither_route(self):
        common = ["--working-dir", str(self.working), "--filename", self.filename]
        with redirect_stdout(io.StringIO()):
            self.assertEqual(attempts.main(["reserve", *common, "--purpose", "initial", "--prompt", "p"]), 0)
        self.host_image("exec-new.png", b"the picture")

        out = io.StringIO()
        with redirect_stdout(out):
            code = attempts.main(["record-generated", *common, "--attempt", "1"])
        self.assertEqual(code, 1)
        self.assertIn("--work-root", json.loads(out.getvalue())["error"])

        out = io.StringIO()
        with redirect_stdout(out):
            code = attempts.main([
                "record-generated", *common, "--attempt", "1",
                "--work-root", str(self.work_root), "--host-dir", str(self.host),
            ])
        self.assertEqual(code, 0)
        self.assertTrue(json.loads(out.getvalue())["recorded"])

    def test_the_worker_is_pointed_at_the_command_and_keeps_the_look_before_giving_up(self):
        text = (ROOT / "references" / "image-scout-generation.md").read_text(encoding="utf-8")
        section = text.split("## Stage returned media", 1)[1].split("## Batch review", 1)[0]
        for phrase in ("record-generated", "--work-root", "--host-file", "--staging-path"):
            self.assertIn(phrase, section)
        # The reason the worker must not carry the picture itself.
        self.assertIn("million characters", section)
        self.assertIn("Windows refuses", section)
        # "Returned nothing" is only said after the host's folder has been looked in.
        self.assertIn("finds no new file", section)
        self.assertIn("interrupt-open", section)


if __name__ == "__main__":
    unittest.main()
