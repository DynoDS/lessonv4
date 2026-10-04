"""Every subject-file rule the teacher's ledger recorded is still where it lives.

The six subject files (maths, history, geography, science, RE, PSHE), the two
files that said how a new one is written, and every line elsewhere that tells an
agent how to find or read one were listed on 23 and 24 September 2026: 490
places (plans/2026-09-23-subject-files-ledger.md). The teacher answered every
decision on 24 September. The skill that wrote new subject files and its guide
are removed ("just remove it completely"), and the plugin knows the six files it
has ("nothing around what could be added in future"); a history lesson teaches
through sources when it uses them; the food rules in PSHE became one line
pointing to the NHS Eatwell Guide, and science has the same line; no lesson
shows a picture of the Prophet Muhammad ("let's not have any pictures of him"),
a rule now in the picture rules every lesson reads, while RE keeps its fuller
rule (any prophet) beside its line that a nativity is ordinary; the
circuit drawing's guidance says standard symbols are Year 6 work. His
calibrating examples keep every word; only their dates went.

`subject_files_ledger_pins.json` holds each row's words where they now live,
each changed row's whole paragraph, the new homes paragraph by paragraph, and
the retired wordings as gone (a row removed with its file is held by that file
staying gone). The fix for a failure here is to update the ledger and the pins
on purpose, with the teacher's say-so.
"""

from __future__ import annotations

import importlib.util
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, RUNTIME, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("subject_files_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-subject-files-ledger.md"
REF = ROOT / "references"
LD = ROOT / "agents" / "lesson-designer.md"
PREF = REF / "preferences.md"

EverySubjectFileRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "SJ", 490)

# The shapes of a sentence about a subject file that does not exist yet.
_SF = r"subject[- ]?[a-z-]*\s*files?"
FILE_TO_COME = (
    _SF + r"\b[^.;]{0,80}\b(?:may|might|will|could|can|should) be (?:added|written|created|made)",
    _SF + r"\b[^.;]{0,60}\b(?:later on|added later|in future|in the future|to come|one day|yet to be)\b",
    r"\b(?:future|later|another|next|additional|further)\s+(?:[a-z]+\s+)?" + _SF,
    r"\buntil\b[^.;]{0,60}" + _SF + r"[^.;]{0,20}\bexists?\b",
    _SF + r"[^.;]{0,30}\b(?:does not|doesn't|do not) (?:yet )?exist",
    _SF + r"\b[^.;]{0,30}\b(?:is|are) planned\b",
    r"\bwhen\b[^.;]{0,30}" + _SF + r"\s+(?:is|are) (?:written|added|made|created)",
    r"\buntil\b[^.;]{0,40}\bown\s+" + _SF,
    r"\bno\s+(?:[a-z]+\s+)?" + _SF + r"\s+yet\b",
    r"\b(?:will|shall)\s+(?:get|have|gain)\s+(?:its|their)?\s*(?:own\s+)?" + _SF,
    _SF + r"\b[^.;]{0,30}\b(?:has|have) not (?:yet )?been (?:written|added|made|created)",
)

YEAR_6 = ("Standard circuit symbols are Year 6 work (`subject-science.md`); a Year 4 lesson shows a labelled "
          "photograph of a real circuit instead (`label-diagram` on the photograph).")


def text(path: Path) -> str:
    return flat(path.read_text(encoding="utf-8"))


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    def test_the_skill_that_wrote_subject_files_is_gone(self) -> None:
        """Decisions 1 and 3, his words: "is this a new skill called make
        subject file skill or something? just remove it completely"."""
        self.assertFalse((ROOT / "skills" / "make-subject-file").exists())
        self.assertFalse((REF / "authoring-subject-files.md").exists())
        for path in RUNTIME + [ROOT / "README.md"]:
            body = text(path)
            for name in ("make-subject-file", "authoring-subject-files", "writing a subject file"):
                with self.subTest(file=str(path.relative_to(ROOT)), name=name):
                    self.assertFalse(name in body, f"{path.name} names {name!r}")

    def test_nothing_speaks_of_a_subject_file_added_later(self) -> None:
        """His words: "it should just knowe the files it has, nothing around
        what could be added in future." The subjects with no file today
        (English, computing, art) still read "where one exists", which is
        about now, not later."""
        for path in RUNTIME + [ROOT / "README.md"]:
            body = text(path).lower()
            for phrase in ("subject-english file", "until a subject", "a new subject file", "future subject",
                           "picked up with no wiring", "nobody has written up yet", "write a subject file",
                           "revise a subject file"):
                with self.subTest(file=str(path.relative_to(ROOT)), phrase=phrase):
                    self.assertFalse(phrase in body, f"{path.name} speaks of a subject file to come: {phrase!r}")
            # A reworded hedge too ("An English subject file may be added
            # later", "a future subject-English file", "until a subject file
            # exists"), by the shape of a file to come, not by fixed words.
            for pattern in FILE_TO_COME:
                for match in re.finditer(pattern, body):
                    with self.subTest(file=str(path.relative_to(ROOT)), pattern=pattern):
                        self.fail(f"{path.name} speaks of a subject file to come: "
                                  f"{body[max(0, match.start() - 60):match.end() + 40]!r}")

    def test_the_file_to_come_shapes_catch_the_hedges(self) -> None:
        """The shapes above catch both hedges the files held and every
        rewording the two independent checks tried, and nothing the files now
        say. Free text is held only this far: a hedge put some other way would
        pass."""
        for sentence in ("An English subject file may be added later; until then use this.",
                         "Detailed English progression belongs in a future subject-English file.",
                         "Until a subject-English file exists, keep the detailed reading guidance below active.",
                         "A new art subject file will be written later.",
                         "There is no music subject file yet to be written.",
                         "A future English subject file will hold the detail.",
                         "English has no subject file yet; one will follow.",
                         "When an English subject file is written, move this guidance there.",
                         "An English subject file is planned.",
                         "Until English has its own subject file, keep this guidance.",
                         "Art and computing will get subject files later.",
                         "The English subject file has not been written yet."):
            with self.subTest(sentence=sentence):
                self.assertTrue(any(re.search(p, sentence.lower()) for p in FILE_TO_COME))
        for sentence in ("Use the matching subject file where one exists.",
                         "Read the one matching `subject-*.md` file when it exists, whole."):
            with self.subTest(sentence=sentence):
                self.assertFalse(any(re.search(p, sentence.lower()) for p in FILE_TO_COME))
        # The English guidance the hedge switched is simply live.
        prompts = text(REF / "reasoning-prompts.md")
        self.assertIn("- English may compare effects, justify structural choices or reason from textual evidence. "
                      "- **Reading comprehension.**", prompts)

    def test_the_six_files_are_the_six_the_reviewer_is_handed(self) -> None:
        """The plugin knows the files it has: the folder and the review
        packet's list name the same six, so neither can gain a subject the
        other does not know."""
        spec = importlib.util.spec_from_file_location("design_review_packet_sj", ROOT / "scripts" / "design-review-packet.py")
        assert spec and spec.loader
        packet = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(packet)
        on_disk = sorted(path.name for path in REF.glob("subject-*.md"))
        self.assertEqual(on_disk, sorted(packet.SUBJECT_REFERENCE_FILES.values()))
        self.assertEqual(len(on_disk), 6)

    def test_history_teaches_through_sources_when_the_lesson_uses_them(self) -> None:
        """Decision 4, his words: "History doesnt always need sources right?
        ... does it have to be a strict rule?\""""
        history = text(REF / "subject-history.md")
        self.assertIn("When the lesson uses sources, teach historical knowledge through the evidence: a concrete "
                      "aspect of life, what a source shows or tells us about it, and a useful comparison or "
                      "inference.", history)
        self.assertNotIn(". Teach historical knowledge through the evidence", history)
        self.assertIn("So a history lesson does not need a source in it, and a lesson whose knowledge is best "
                      "delivered by storytelling and shared reading is not weaker for having none.", history)

    def test_no_lesson_asks_for_a_picture_of_the_prophet_muhammad(self) -> None:
        """His answer to the change plan's question 1: "Okay, so yeah, let's
        not have any pictures of him." Then, asked whether every lesson gets
        only the Prophet Muhammad while RE keeps its fuller rule with its
        exception: "yes to prohet muhammad not being pictured". Every lesson's
        designer reads the narrow rule in its picture rules; RE keeps "or of any
        prophet" beside its line that a nativity is ordinary, and points there,
        because an RE lesson's reviewer and adaptation designer read the RE file
        and not that section."""
        home = section_by_heading(PREF, "### Lesson Designer visual-need boundary", 0)
        self.assertIn("**Islam does not depict the Prophet Muhammad, and no lesson may request a picture of "
                      "him.**", home)
        self.assertNotIn("any prophet", home)
        re_file = text(REF / "subject-re.md")
        self.assertIn("Islam does not depict Muhammad, and no lesson may request a picture of him or of any "
                      "prophet (every lesson's rule, no picture of the Prophet Muhammad, is in `preferences.md` → "
                      "Lesson Designer visual-need boundary); teach through the mosque, the Qur'an, calligraphy, "
                      "the practice or the community instead.", re_file)
        # RE's exception sits straight before its fuller rule.
        self.assertIn("Christian art depicts Jesus freely, so a nativity, a crucifix or a Bible illustration is "
                      "ordinary teaching material. Islam does not depict Muhammad, and no lesson may request",
                      re_file)
        self.assertIn("request the place, object, text or practice rather than the figure", re_file)
        # The designer is sent to that section at the picture decision and in
        # its reading list, in every lesson.
        designer = text(LD)
        self.assertIn("**Settle WHICH pictures the lesson wants before any of that, and read `preferences.md` "
                      "→ Lesson Designer visual-need boundary here to do it.**", designer)
        self.assertIn("- Read the Lesson Designer parts of `Slide Philosophy`: `Lesson Designer content "
                      "boundaries`, `Lesson Designer visual-need boundary` and `Speaker notes hand-off`.", designer)
        # The adaptation designer writes its own photograph requests and does
        # not read that section, so the every-lesson sentence is where it
        # decides them, in every lesson.
        adaptation = ROOT / "agents" / "adaptation-designer.md"
        self.assertIn("The adaptation may request its own required photographs even when Expected uses none. Use the "
                      "smallest coherent visual set the learning and access genuinely require. There is no fixed "
                      "picture maximum, but visual-heavy content creates serious fitting risk. Islam does not depict "
                      "the Prophet Muhammad, and no lesson may request a picture of him (`preferences.md` → Lesson "
                      "Designer visual-need boundary).",
                      section_by_heading(adaptation, "### 5. Plan visual requirements for any separate resource "
                                                     "being designed", 0))
        # And the RE file's other two readers read it whole: the reviewer is
        # handed the whole file (the packet reserves a section only in maths),
        # and the adaptation designer reads it at the start.
        self.assertIn("read the matching subject file when one exists",
                      text(ROOT / "agents" / "design-reviewer.md"))
        spec = importlib.util.spec_from_file_location("design_review_packet_sj_re", ROOT / "scripts" / "design-review-packet.py")
        assert spec and spec.loader
        packet = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(packet)
        self.assertEqual(set(packet.SUBJECT_SECTIONS_FOR_OTHER_AGENTS), {"subject-maths.md"})
        self.assertIn("`[PLUGIN_ROOT]/references/subject-[subject].md`", text(adaptation))

    def test_a_nativity_picture_in_a_christmas_lesson_is_not_refused(self) -> None:
        """The reason for his narrower every-lesson rule: a history lesson on a
        Victorian Christmas, or a Year 2 Noah's Ark story, never reads the RE
        file and its line that a nativity is ordinary, so the rule it does read
        must not reach them."""
        home = section_by_heading(PREF, "### Lesson Designer visual-need boundary", 0)
        # The only picture limit the every-lesson section names for a religious
        # figure is the Prophet Muhammad's.
        rule = re.findall(r"no lesson may request a picture of ([^.*]+)", home)
        self.assertEqual(rule, ["him"])
        self.assertIn("**Islam does not depict the Prophet Muhammad, and no lesson may request a picture of him.**",
                      home)
        for word in ("prophet.", "prophets", "any prophet", "picture of Jesus", "nativity scene", "religious figure"):
            with self.subTest(word=word):
                self.assertNotIn(word, home.replace("the Prophet Muhammad", ""))
        # The section still counts a nativity as a thing worth showing: its own
        # Christmas example is a nativity that was never requested.
        self.assertIn("reached a class with a nativity, a carol service and a Bible all available and none of them "
                      "requested", home)
        # Outside RE, no instruction file limits pictures of any prophet but
        # him: the phrase "any prophet" lives in the RE file alone. (The
        # section's paragraphs are also pinned as a home, so a new line there
        # of any wording is caught.)
        for path in RUNTIME:
            if path.name == "subject-re.md":
                continue
            with self.subTest(file=path.name):
                self.assertNotIn("any prophet", text(path).lower())
        # And no program refuses a picture by what it shows: the rule is guidance
        # the designer follows, so nothing can refuse a nativity by mistake.
        programs = sorted((ROOT / "scripts").glob("*.py")) + sorted(
            path for folder in ("builder", "worksheet-html", "working-wall-html", "stick-in-sheets-html", "shared")
            for path in (ROOT / folder).rglob("*.js")
            if "node_modules" not in path.parts and "test" not in path.parts and "out" not in path.parts)
        for path in programs:
            body = path.read_text(encoding="utf-8").lower()
            for word in ("prophet", "muhammad"):
                with self.subTest(program=path.name, word=word):
                    self.assertNotIn(word, body)

    def test_circuit_symbols_are_year_6_work(self) -> None:
        """Decision 8, his "yes": the circuit drawing's guidance says it is
        for Year 6 symbol work; the science file stays as it is."""
        templates = text(REF / "templates.md")
        self.assertEqual(templates.count(YEAR_6), 2)
        self.assertIn(YEAR_6, section_by_heading(REF / "templates.md", "### `circuit-diagram`", 0))
        self.assertIn(YEAR_6, section_by_heading(REF / "worksheet-helpers" / "science.md", "## The three science pictures", 0))
        self.assertIn(YEAR_6, section_by_heading(REF / "working-wall-card-contracts.md", "### circuit-diagram", 0))
        self.assertIn("Recognised circuit symbols belong to Year 6.", text(REF / "subject-science.md"))

    def test_the_start_note_is_the_designers_reading_line(self) -> None:
        """Settled item 12: history's and geography's word-for-word start
        notes fold into the designer's own reading line, carrying what they
        held; the four other files keep notes with their own extras."""
        designer = text(LD)
        self.assertIn("- Read the one matching `subject-*.md` file when it exists, whole, with `--file` and every "
                      "page, before the structure is chosen: in history and geography its routing is part of that "
                      "choice.", designer)
        self.assertIn("Come back to it alongside the teaching-sequence file once the structure is set: the "
                      "structure file tells you what shape the lesson takes, and the subject file what the "
                      "thinking inside it should be.", designer)
        for name in ("subject-history.md", "subject-geography.md"):
            with self.subTest(file=name):
                self.assertNotIn("Read this at the start of the run", text(REF / name))
        for name, note in (
            ("subject-maths.md", "Read this at the start of the run when the lesson is Maths"),
            ("subject-science.md", "Read this at the start of a Science lesson"),
            ("subject-re.md", "Read this at the start of an RE lesson"),
            ("subject-pshe.md", "Read this at the start of a PSHE lesson"),
        ):
            with self.subTest(file=name):
                self.assertIn(note, text(REF / name))
        self.assertNotIn("The PSHE label does not determine the route.", text(REF / "subject-pshe.md"))
        self.assertIn("The subject file does not select a route by label alone", designer)

    def test_his_examples_keep_every_word_but_their_dates(self) -> None:
        """Settled item 10: the sketch loses only "(4 September 2026)" from the
        sentence that introduces it."""
        history = text(REF / "subject-history.md")
        self.assertIn("The shape that produces this, in the order a child meets it, is the user's own sketch of a "
                      "Victorian schooling lesson, kept here as the calibration:", history)
        self.assertIn("The Teach boards of the Tudor lesson the user chose (`preferences.md` → Pride Lessons,", history)
        # The Tudor deck keeps its telling, undated, as a plain example.
        self.assertIn("A deck that told its invented cases in the present tense, named \"Tudor\" once or twice in "
                      "eighteen slides, and asked every question about the one child, and the user found the class "
                      "would come away thinking \"that child experienced it, rather than this was a different time "
                      "in history and many children experienced this\".", history)
        maths = text(REF / "subject-maths.md")
        self.assertIn("(the teacher, after the nearest-100 lesson modelled 34 first)", maths)
        self.assertIn("the way a maths question should read. Their questions are short", maths)
        for phrase in ("(4 September 2026)", "14 September 2026"):
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, history)
        for phrase in ("19 September 2026", "(16 September 2026)"):
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, maths)

    def test_the_out_of_date_lines_say_what_is_true(self) -> None:
        """Settled item 7, and the reviewer's line in geography."""
        history = text(REF / "subject-history.md")
        self.assertIn("their own guidance places each mark in proportion to its real date, and a line is never "
                      "labelled not to scale", history)
        self.assertIn("**Infer from evidence.** Here is a source, what does it tell us, and how do you know. The "
                      "historical part is the second half", history)
        self.assertIn("The design reviewer reads the finished design against this file and asks whether it reads "
                      "as the subject.", text(REF / "subject-geography.md"))


if __name__ == "__main__":
    unittest.main()
