"""A lesson built in the cloud reaches the teacher's drive through the letterbox.

The cloud half (`deliver_files.send_to_letterbox`) and the login half
(`letterbox_filer.run`) are exercised against a local bare repository standing in
for GitHub, so the whole journey runs without a network: a cloud run posts a
lesson, the teacher's computer collects it, saves it where its own settings say,
and clears it from the letterbox.
"""
from __future__ import annotations

import importlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import deliver_files  # noqa: E402
import plugin_settings  # noqa: E402

BRANCH = plugin_settings.DEFAULT_LETTERBOX_BRANCH
TERM_DATES = (
    "| Term | Starts | Ends |\n| --- | --- | --- |\n"
    "| Autumn 1 | Tuesday 1 September 2026 | Friday 23 October 2026 |\n"
)


def git(*args, cwd=None):
    result = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    return result.stdout


class LetterboxJourneyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.remote = self.root / "remote.git"
        git("init", "-q", "--bare", str(self.remote))
        seed = self.root / "seed"
        git("clone", "-q", str(self.remote), str(seed))
        (seed / "README.md").write_text("letterbox\n", encoding="utf-8")
        git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "start", cwd=seed)
        git("add", "README.md", cwd=seed)
        git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "readme", cwd=seed)
        git("push", "-q", "origin", "HEAD", cwd=seed)
        self.cloud = self.root / "cloud-clone"
        git("clone", "-q", str(self.remote), str(self.cloud))
        self.pc = self.root / "pc-clone"
        git("clone", "-q", str(self.remote), str(self.pc))

        self.home = self.root / "plugin-home"
        self.home.mkdir()
        self.previous_home = os.environ.get("LESSON_RESOURCES_HOME")
        os.environ["LESSON_RESOURCES_HOME"] = str(self.home)
        self.drive = self.root / "Drive"
        (self.drive / "2026-2027 - Year 4").mkdir(parents=True)
        (self.home / "term-dates.md").write_text(TERM_DATES, encoding="utf-8")
        self.built = self.root / "output"
        self.built.mkdir()
        global letterbox_filer
        letterbox_filer = importlib.import_module("letterbox_filer")

    def tearDown(self):
        if self.previous_home is None:
            os.environ.pop("LESSON_RESOURCES_HOME", None)
        else:
            os.environ["LESSON_RESOURCES_HOME"] = self.previous_home
        self.temp.cleanup()

    def settings(self, sorting=True):
        plugin_settings.write_settings({
            "delivery": {"folder": str(self.drive), "sorting": sorting, "termDates": str(self.home / "term-dates.md")},
            "letterbox": {"clone": str(self.pc), "branch": BRANCH},
        })

    def post(self, lesson, subject="Maths", content=b"deck", minute=0):
        name = f"{lesson}.pptx"
        (self.built / name).write_bytes(content)
        (self.built / f"{lesson} - run report.md").write_text("notes", encoding="utf-8")
        return deliver_files.send_to_letterbox(
            clone=self.cloud, branch=BRANCH, source=self.built,
            requested=[name, f"{lesson} - run report.md"], year=4, subject=subject,
            lesson=lesson, dry_run=False, now=datetime(2026, 9, 15, 6, minute, tzinfo=timezone.utc),
        )

    def waiting(self):
        git("fetch", "-q", "origin", cwd=self.pc)
        listing = subprocess.run(["git", "ls-tree", "-r", "--name-only", f"origin/{BRANCH}"], cwd=self.pc,
                                 capture_output=True, text=True).stdout
        return sorted({line.split("/")[1] for line in listing.splitlines() if line.startswith("lessons/")})

    def test_a_cloud_lesson_is_saved_into_the_next_free_day_and_cleared(self):
        self.settings()
        destination, files, skipped = self.post("Round to 10")
        self.assertEqual([p.name for p in files], ["Round to 10.pptx"])
        self.assertEqual([p.name for p in skipped], ["Round to 10 - run report.md"], "run records stay out of the letterbox")
        self.assertEqual(len(self.waiting()), 1)

        monday = self.drive / "2026-2027 - Year 4" / "Autumn 1" / "Week 2" / "Maths" / "Monday"
        monday.mkdir(parents=True)
        (monday / "taken.pptx").write_bytes(b"x")
        self.assertEqual(letterbox_filer.run(today=date(2026, 9, 14)), 0)

        tuesday = self.drive / "2026-2027 - Year 4" / "Autumn 1" / "Week 2" / "Maths" / "Tuesday"
        self.assertEqual((tuesday / "Round to 10.pptx").read_bytes(), b"deck")
        self.assertEqual(self.waiting(), [], "a saved lesson leaves the letterbox")

    def test_two_lessons_in_one_login_take_two_days(self):
        self.settings()
        self.post("Lesson A", minute=1)
        self.post("Lesson B", minute=2)
        letterbox_filer.run(today=date(2026, 9, 14))
        week = self.drive / "2026-2027 - Year 4" / "Autumn 1" / "Week 2" / "Maths"
        self.assertTrue((week / "Monday" / "Lesson A.pptx").is_file())
        self.assertTrue((week / "Tuesday" / "Lesson B.pptx").is_file())

    def test_a_plain_folder_gets_the_files_directly(self):
        self.settings(sorting=False)
        self.post("Rainforests", subject="Geography")
        letterbox_filer.run(today=date(2026, 9, 14))
        self.assertTrue((self.drive / "Rainforests.pptx").is_file())

    def test_a_different_file_already_there_is_never_overwritten(self):
        self.settings(sorting=False)
        (self.drive / "Rainforests.pptx").write_bytes(b"the teacher's own edit")
        self.post("Rainforests", subject="Geography", content=b"cloud deck")
        letterbox_filer.run(today=date(2026, 9, 14))
        self.assertEqual((self.drive / "Rainforests.pptx").read_bytes(), b"the teacher's own edit")
        self.assertEqual(len(self.waiting()), 1, "the lesson waits for the teacher rather than being lost")

    def test_a_lesson_saved_before_a_failed_clear_is_not_saved_twice(self):
        self.settings()
        _, _, _ = self.post("Round to 10")
        name = self.waiting()[0]
        (self.home / "letterbox-filed.json").write_text(json.dumps({name: "somewhere"}), encoding="utf-8")
        letterbox_filer.run(today=date(2026, 9, 14))
        week = self.drive / "2026-2027 - Year 4" / "Autumn 1" / "Week 2" / "Maths"
        self.assertFalse(week.exists(), "no second copy in the next free day")
        self.assertEqual(self.waiting(), [])

    def test_with_the_drive_unavailable_everything_waits(self):
        self.settings()
        self.post("Round to 10")
        plugin_settings.write_settings({"delivery": {"folder": str(self.root / "Unplugged")}})
        letterbox_filer.run(today=date(2026, 9, 14))
        self.assertEqual(len(self.waiting()), 1)

    def test_the_filer_copy_carries_every_file_it_imports(self):
        # The login task runs a copy outside the package; a module missing from
        # the copy fails at login where nobody sees it.
        text = (SCRIPTS / "letterbox_filer.py").read_text(encoding="utf-8")
        for module in ("plugin_settings", "deliver_files", "resolve-filing.py"):
            self.assertIn(module, text)
        self.assertEqual(
            set(plugin_settings.FILER_FILES),
            {"letterbox_filer.py", "plugin_settings.py", "deliver_files.py", "resolve-filing.py"},
        )
        check_setup = (SCRIPTS / "check-setup.js").read_text(encoding="utf-8")
        for name in plugin_settings.FILER_FILES:
            self.assertIn(f"'{name}'", check_setup, "check-setup.js refreshes the same files")


class CodexCloudFetchesItsLetterboxTests(unittest.TestCase):
    """Codex's cloud attaches one repository, so the run fetches the letterbox itself."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.saved = {k: os.environ.get(k) for k in ("LESSON_RESOURCES_HOME", "GITHUB_TOKEN", "GH_TOKEN", plugin_settings.LETTERBOX_VARIABLE)}
        os.environ["LESSON_RESOURCES_HOME"] = str(self.root / "home")
        os.environ.pop("GH_TOKEN", None)

    def tearDown(self):
        for key, value in self.saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        self.temp.cleanup()

    def test_the_key_is_sent_as_a_header_and_never_in_plain_form(self):
        os.environ.pop("GITHUB_TOKEN", None)
        self.assertEqual(plugin_settings.github_auth_args(), [])
        os.environ["GITHUB_TOKEN"] = "github_pat_example_secret"
        args = plugin_settings.github_auth_args()
        self.assertEqual(args[0], "-c")
        self.assertIn("extraheader=AUTHORIZATION: basic ", args[1])
        self.assertNotIn("github_pat_example_secret", " ".join(args))

    def test_a_named_letterbox_nobody_attached_is_fetched_and_a_lesson_posted(self):
        os.environ.pop("GITHUB_TOKEN", None)
        remote = self.root / "remote.git"
        git("init", "-q", "--bare", str(remote))
        seed = self.root / "seed"
        git("clone", "-q", str(remote), str(seed))
        git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "start", cwd=seed)
        git("push", "-q", "origin", "HEAD", cwd=seed)
        os.environ[plugin_settings.LETTERBOX_VARIABLE] = "Someone/outputs"
        self.assertEqual(plugin_settings.delivery()["folder"], "", "nothing is attached yet")

        prepared = plugin_settings.prepare_letterbox(url=str(remote))
        self.assertTrue((Path(prepared["clone"]) / ".git").exists(), prepared)

        built = self.root / "output"
        built.mkdir()
        (built / "Fractions.pptx").write_bytes(b"deck")
        deliver_files.send_to_letterbox(
            clone=Path(prepared["clone"]), branch=BRANCH, source=built, requested=["Fractions.pptx"],
            year=4, subject="Maths", lesson="Fractions", dry_run=False,
        )
        listing = git("ls-tree", "-r", "--name-only", BRANCH, cwd=remote)
        self.assertIn("Fractions.pptx", listing)

    def test_a_letterbox_that_cannot_be_fetched_says_why_and_mentions_a_missing_key(self):
        os.environ.pop("GITHUB_TOKEN", None)
        os.environ[plugin_settings.LETTERBOX_VARIABLE] = "Someone/outputs"
        prepared = plugin_settings.prepare_letterbox(url=str(self.root / "no-such-repo.git"))
        self.assertIn("could not be fetched", prepared["error"])
        self.assertIn("No GITHUB_TOKEN is set", prepared["error"])


class WorkCloudPostsThroughItsOwnToolsTests(unittest.TestCase):
    """ChatGPT Work's cloud has no git sign-in but can commit through its GitHub tools."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.saved = {k: os.environ.get(k) for k in ("LESSON_RESOURCES_HOME", "GITHUB_TOKEN", "GH_TOKEN", plugin_settings.LETTERBOX_VARIABLE)}
        os.environ["LESSON_RESOURCES_HOME"] = str(self.root / "home")
        for key in ("GITHUB_TOKEN", "GH_TOKEN", plugin_settings.LETTERBOX_VARIABLE):
            os.environ.pop(key, None)
        self.output = self.root / "output"
        self.output.mkdir()
        (self.output / "Fractions.pptx").write_bytes(b"deck")
        (self.output / "Fractions - run report.md").write_text("notes", encoding="utf-8")

    def tearDown(self):
        for key, value in self.saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        self.temp.cleanup()

    def test_a_letterbox_git_cannot_reach_is_staged_in_the_letterbox_layout(self):
        destination, files, skipped = deliver_files.stage_for_connector(
            stage_root=self.output / "letterbox-staging", source=self.output,
            requested=["Fractions.pptx", "Fractions - run report.md"], year=4, subject="Maths",
            lesson="Fractions", dry_run=False, now=datetime(2026, 9, 14, 2, 0, tzinfo=timezone.utc),
        )
        self.assertEqual(destination.parent.name, "lessons")
        self.assertEqual(sorted(p.name for p in destination.iterdir()), ["Fractions.pptx", "lesson.json"])
        manifest = json.loads((destination / "lesson.json").read_text(encoding="utf-8"))
        self.assertEqual((manifest["year"], manifest["subject"], manifest["files"]), (4, "Maths", ["Fractions.pptx"]))
        self.assertEqual([p.name for p in skipped], ["Fractions - run report.md"])

    def test_delivery_names_the_route_and_the_staged_folder(self):
        import contextlib
        import io

        with mock_prepare_failure():
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = deliver_files.main([
                    "--letterbox", "Someone/outputs", "--source", str(self.output), "--file", "Fractions.pptx",
                    "--year", "4", "--subject", "Maths", "--lesson", "Fractions",
                ])
        text = out.getvalue()
        self.assertEqual(code, 0, text)
        for line in ("LETTERBOX_ROUTE=connector", "LETTERBOX_REPO=Someone/outputs", f"LETTERBOX_BRANCH={BRANCH}", "STATUS=STAGED"):
            self.assertIn(line, text)
        staged = next(l.split("=", 1)[1] for l in text.splitlines() if l.startswith("LETTERBOX_STAGED="))
        self.assertTrue(list(Path(staged).glob("lessons/*/Fractions.pptx")))


class mock_prepare_failure:
    """prepare_letterbox as it answers on a box with no git sign-in."""

    def __enter__(self):
        self.original = plugin_settings.prepare_letterbox
        plugin_settings.prepare_letterbox = lambda url=None: {"clone": "", "branch": BRANCH, "error": "no sign-in"}

    def __exit__(self, *exc):
        plugin_settings.prepare_letterbox = self.original


class CloudRunFindsItsLetterboxTests(unittest.TestCase):
    def test_a_named_repository_is_found_as_a_clone_beside_the_working_folder(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp) / "plugin-repo"
            work.mkdir()
            box = Path(temp) / "outputs"
            git("init", "-q", str(box))
            git("remote", "add", "origin", "https://github.com/Someone/teaching-outputs.git", cwd=box)
            previous = (Path.cwd(), os.environ.get(plugin_settings.LETTERBOX_VARIABLE))
            os.chdir(work)
            os.environ[plugin_settings.LETTERBOX_VARIABLE] = "Someone/teaching-outputs"
            try:
                found = plugin_settings.delivery()
            finally:
                os.chdir(previous[0])
                os.environ.pop(plugin_settings.LETTERBOX_VARIABLE, None)
            self.assertEqual(found["mode"], "letterbox")
            self.assertEqual(Path(found["folder"]).resolve(), box.resolve())
            self.assertEqual(found["branch"], BRANCH)

    def test_a_computer_without_the_variable_is_not_a_cloud_run(self):
        os.environ.pop(plugin_settings.LETTERBOX_VARIABLE, None)
        self.assertNotEqual(plugin_settings.delivery()["mode"], "letterbox")


if __name__ == "__main__":
    unittest.main()
