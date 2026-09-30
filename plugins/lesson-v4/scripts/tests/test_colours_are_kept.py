"""Every colour rule the teacher's answers changed is still where it lives.

His answers of 24 September 2026 on the rest-of-preferences list (decision 11,
with the change plan's question 1, and decision 22's colour half): blue is a
question or a short task ("Explain your answer.", "Write one reason.") and a
longer instruction about how to go about it stays black; green is a taught word
or an answer, and the template catalogue's exceptions are corrected; a worked
example is purple, the same colour as a sticky fact; and the working wall uses
the board's colour meanings. The rule's one home is the visual profile's
Semantic colour; preferences keeps his words and points there.

`colours_ledger_pins.json` holds every ledger row the release changed (from
`plans/2026-09-23-preferences-rest-ledger.md` and the starters list), where its
words now live and each changed rule's whole paragraph, the rows kept on
purpose, the new mechanisms, the profile's home paragraph by paragraph, and the
retired wordings as gone. The rest-of-preferences list's own pin file (release
7B) takes these rows' pins from here. The fix for a failure is to update the
ledger and the pins on purpose, with the teacher's say-so, never to delete a pin.
"""

from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import HEADING, PROGRAMS, ROOT, RUNTIME, flat, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("colours_ledger_pins.json")
PLANS = ROOT.parents[1] / "plans"


class EveryColourRowIsStillInItsHome(unittest.TestCase):
    def setUp(self) -> None:
        self.data = json.loads(PINS.read_text(encoding="utf-8"))
        self.pins = self.data["rows"]
        self.texts: dict[str, str] = {}

    def text(self, rel: str) -> str:
        if rel not in self.texts:
            self.texts[rel] = flat((ROOT / rel).read_text(encoding="utf-8"))
        return self.texts[rel]

    def test_every_changed_row_is_pinned_once(self) -> None:
        ids = [row["id"] for row in self.pins]
        self.assertEqual(len(ids), len(set(ids)), "a row is pinned twice")
        self.assertEqual(len(self.data["changedRows"]), 40)
        for rid in self.data["changedRows"]:
            with self.subTest(row=rid):
                self.assertIn(rid, ids)
                row = next(r for r in self.pins if r["id"] == rid)
                # A rule that was kept or moved is pinned where it lives now.
                self.assertTrue(row["present"], row["outcome"])

    def test_the_rows_are_the_ledgers_own(self) -> None:
        for prefix, rel in self.data["ledgers"].items():
            ledger = PLANS / Path(rel).name
            if not ledger.exists():
                self.skipTest("the ledgers live in the development checkout's plans folder")
            ids = set(re.findall(rf"^\| ({prefix}-[A-Z]\d{{2}}) \|", ledger.read_text(encoding="utf-8"), re.MULTILINE))
            for rid in self.data["changedRows"]:
                if rid.startswith(prefix + "-"):
                    with self.subTest(row=rid):
                        self.assertIn(rid, ids)

    def test_every_kept_rule_is_present_word_for_word(self) -> None:
        for row in self.pins:
            for pin in row["present"]:
                with self.subTest(row=row["id"], file=pin["file"]):
                    self.assertIn(pin["text"], self.text(pin["file"]))

    def test_every_kept_rule_is_still_in_its_section(self) -> None:
        for row in self.pins:
            for pin in row["present"]:
                if not pin.get("section"):
                    continue
                with self.subTest(row=row["id"], file=pin["file"], section=pin["section"]["heading"]):
                    home = section_by_heading(ROOT / pin["file"], pin["section"]["heading"],
                                              pin["section"]["occurrence"], pin["section"].get("intro", False))
                    self.assertIn(pin["text"], home)

    def test_a_paragraph_pinned_whole_is_still_exactly_that_paragraph(self) -> None:
        for row in self.pins:
            for pin in row["present"]:
                if not pin.get("paragraph"):
                    continue
                raw = (ROOT / pin["file"]).read_text(encoding="utf-8").replace("\r\n", "\n")
                with self.subTest(row=row["id"], file=pin["file"]):
                    self.assertIn(pin["text"], {flat(x) for x in raw.split("\n\n")})

    def test_every_retired_phrase_stays_gone(self) -> None:
        # Each file is read and flattened once for this check, not once per
        # phrase; a file reports only when it holds a phrase.
        bodies: dict[Path, str] = {}
        for row in self.pins:
            for pin in row["absent"]:
                own = ROOT / pin["file"]
                files = sorted(set(RUNTIME) | set(PROGRAMS) | {own}) if pin.get("everywhere") else [own]
                for path in files:
                    if path not in bodies:
                        bodies[path] = flat(path.read_text(encoding="utf-8"))
                    if pin["text"] in bodies[path]:
                        with self.subTest(row=row["id"], file=str(path.relative_to(ROOT))):
                            self.assertNotIn(pin["text"], bodies[path])

    def test_the_home_holds_exactly_its_paragraphs(self) -> None:
        for home in self.data["homes"]:
            lines = (ROOT / home["file"]).read_text(encoding="utf-8").splitlines()
            start = lines.index(home["heading"])
            level = len(home["heading"].split(" ")[0])
            end = next(i for i in range(start + 1, len(lines))
                       if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)
            body = "\n".join(lines[start + 1:end]).split("\n\n")
            with self.subTest(home=home["file"], heading=home["heading"]):
                self.assertEqual([flat(x) for x in body if flat(x) and flat(x) != "---"], home["paragraphs"])


class TheTeachersColourAnswersAreWritten(unittest.TestCase):
    PROFILE = section_by_heading(ROOT / "references" / "teacher-slide-visual-profile.md", "## Semantic colour", 0)
    PREF = section_by_heading(ROOT / "references" / "preferences.md", "### Slide Designer presentation rules", 0)

    def test_blue_is_a_question_or_a_short_task(self) -> None:
        """Decision 11 and question 1: "I want blue means question or like a short task"."""
        self.assertIn("I want blue means question or like a short task as in like explain why or something like that.", self.PREF)
        self.assertIn("a longer instruction about how to go about it stays black", self.PREF)
        self.assertIn("House blue is the colour of the child's job: a question they answer, or a short task.", self.PROFILE)
        self.assertNotIn("a task is black either way", self.PROFILE)

    def test_a_job_with_its_how_is_blue_and_how_alone_is_black(self) -> None:
        """His answer of 25 September 2026: "Explain your answer using the photograph." is blue ("y")."""
        tmpl = flat((ROOT / "references" / "templates.md").read_text(encoding="utf-8"))
        for text in (self.PROFILE, self.PREF, tmpl):
            self.assertIn("`Explain your answer using the photograph.`", text)
            self.assertNotIn("Point to the details in the photograph that support your comparison", text)
        self.assertIn("A job that also names what to use is still the job, and blue: `Explain your answer using the "
                      "photograph.` and `Describe each tooth using the pictures.`", self.PROFILE)
        self.assertIn("`Use the shaded map.`, `Use the number line to help you.` and `Look at the shaded areas and "
                      "the Equator.` are all black", self.PROFILE)
        self.assertIn("he said \"y\" (25 September 2026)", self.PREF)
        self.assertIn("and a job that also names what to use (`Explain your answer using the photograph.`)", tmpl)

    def test_a_short_task_is_marked_by_its_role_not_counted(self) -> None:
        """Question 1: the job is blue, advice is black; the designer says which, the check reads it."""
        self.assertIn("marked `colorRole: \"task-blue\"`", self.PROFILE)
        self.assertIn("no count of words decides it", self.PROFILE)
        self.assertNotIn("five words or fewer", self.PROFILE)
        check = flat((ROOT / "builder" / "scripts" / "check-slide-design.js").read_text(encoding="utf-8"))
        self.assertIn("signal: 'TASK_BLUE_NOT_A_SHORT_TASK',", check)
        self.assertNotIn("SHORT_TASK_MAX_WORDS", check)
        roles = flat((ROOT / "builder" / "src" / "presentation-text.js").read_text(encoding="utf-8"))
        self.assertIn("if (role === 'task-blue') return COLOURS.title;", roles)
        self.assertFalse((ROOT / "builder" / "src" / "task-wording.js").exists())

    def test_the_header_cue_stays_black(self) -> None:
        """It tells a child how to go about the task, and advice stays black."""
        profile = flat((ROOT / "references" / "teacher-slide-visual-profile.md").read_text(encoding="utf-8"))
        self.assertIn("The cue is drawn black.", profile)
        headers = flat((ROOT / "builder" / "src" / "headers.js").read_text(encoding="utf-8"))
        self.assertNotIn("isShortTask", headers)

    def test_a_worked_example_is_purple_like_a_sticky_fact(self) -> None:
        """Decision 11: "worked example purple too"."""
        self.assertIn("\"worked example purple too\"", self.PREF)
        self.assertIn("- A worked example is purple, the same colour as a sticky fact.", self.PROFILE)
        self.assertNotIn("whatever carries it", self.PROFILE)
        self.assertIn("Prepared examples and `visible-in-unit` models are worked examples", self.PREF)
        self.assertNotIn("are teaching content and stay black", self.PREF)
        roles = flat((ROOT / "builder" / "src" / "presentation-text.js").read_text(encoding="utf-8"))
        self.assertIn("if (role === 'worked-purple') return COLOURS.worked;", roles)
        styles = flat((ROOT / "builder" / "src" / "styles.js").read_text(encoding="utf-8"))
        self.assertIn("sticky: '7030A0',", styles)
        self.assertIn("worked: '7030A0',", styles)

    def test_green_is_a_taught_word_or_an_answer(self) -> None:
        """Decision 11: "green is vocabulary or an answer. So we'd have to fix those."."""
        self.assertIn("And yeah, green is vocabulary or an answer.", self.PREF)
        self.assertIn("**Green has a fixed teaching role.**", self.PREF)

    def test_the_wall_uses_the_boards_colours(self) -> None:
        """Decision 22: yes."""
        style = json.loads((ROOT / "working-wall-html" / "style.json").read_text(encoding="utf-8"))["colours"]
        self.assertEqual(style["stickyTitleBarFill"], "7030A0")
        self.assertEqual(style["workedExampleTitleBarFill"], "7030A0")
        self.assertEqual(style["vocabDefinitionTitleBarFill"], "00B050")
        for key, value in style.items():
            if key != "rainbowPalette":
                with self.subTest(key=key):
                    self.assertNotIn(value, ("0D9488", "1F4E79", "D97706"))


if __name__ == "__main__":
    unittest.main()
