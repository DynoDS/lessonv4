"""A lesson run never puts its own work into the package, or out to the world.

A run that met a visual the engine could not draw used to build the helper
straight into the git checkout, bump the plugin version and push it. The helper
had been rendered by nobody and read by nobody, and the push put it in front of
every lesson anyone built from this package. The teacher found out from the
marketplace.

Work produced as a side effect of a lesson is unreviewed by definition: the
lesson is what somebody asked for, and the helper is what the lesson turned out
to need. It is built, it waits in the run's own folder, and a person installs it.
That boundary is what these tests hold, across every file a run actually reads.

The deliberate commands - `/install-helper`, `/edit-templates`,
`/make-subject-file` - are outside this rule on purpose.
Each is invoked by the teacher, for the package, with the teacher present.
"""
from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORING = ROOT / "references" / "helper-authoring.md"
INSTALL_HEADING = "## Finish every install"

PUBLISHING_PHRASES = (
    "git push",
    "git commit",
    "commit and push",
    "commit from",
    "and push,",
    "and push.",
)


def run_files() -> list[Path]:
    """Every instruction file a lesson run reads, except the two owned elsewhere."""
    files = sorted(ROOT.glob("agents/*.md"))
    files += sorted((ROOT / "skills" / "make-lesson").glob("*.md"))
    files += [
        path
        for path in sorted(ROOT.glob("references/*.md"))
        if path != AUTHORING
    ]
    return files


def offending(text: str) -> list[str]:
    lowered = text.lower()
    return [phrase for phrase in PUBLISHING_PHRASES if phrase in lowered]


class RunNeverPublishesTests(unittest.TestCase):
    def test_no_file_a_run_reads_tells_it_to_commit_or_push(self):
        for path in run_files():
            found = offending(path.read_text(encoding="utf-8"))
            self.assertEqual(
                found, [],
                f"{path.relative_to(ROOT).as_posix()} tells a lesson run to publish: "
                f"{found}. Work produced during a run waits for a person.",
            )

    def test_the_authoring_guides_build_half_never_publishes_either(self):
        # The guide is read at two moments. Everything before the install section
        # is the build, which happens mid-lesson with nobody looking.
        text = AUTHORING.read_text(encoding="utf-8")
        self.assertIn(INSTALL_HEADING, text)
        build_half = text[: text.index(INSTALL_HEADING)]
        self.assertEqual(offending(build_half), [])

    def test_the_install_half_asks_the_teacher_before_publishing(self):
        text = AUTHORING.read_text(encoding="utf-8")
        install_half = text[text.index(INSTALL_HEADING):]
        self.assertIn("once the teacher has said to", install_half)
        self.assertIn("Never commit or push on your own judgement", install_half)

    def test_a_run_does_not_version_the_package(self):
        # Bumping the version is how a change reaches everyone's cache, so it is
        # half a publish and belongs with the other half.
        for path in run_files():
            text = path.read_text(encoding="utf-8")
            self.assertNotIn(
                "plugin.json", text,
                f"{path.relative_to(ROOT).as_posix()} versions the package "
                "during a lesson run.",
            )


if __name__ == "__main__":
    unittest.main()
