"""Every starters, sticky knowledge and Apply rule the teacher's ledger recorded
is still where it lives.

What the plugin says about how a lesson opens and closes was written 390 times:
what the starter retrieves and when a question about today may open instead,
its form and slide 1, practising a real test question, what counts as sticky
knowledge and where a sticky fact sits, the Apply and the dialogic Reflect, the
purposeful ending and what a lesson hands on, and what the reviewer and the
programs check. The streamline of 23 and 24 September 2026 listed every one
(plans/2026-09-23-starters-sticky-apply-ledger.md), the teacher answered its
three decisions and its settled items, and release 7A (4.2.293) built them with
the rows of the other topic 7 list that live in the same paragraphs: the
Lesson 2 plan, the slide titles and the working wall's wording.

`starters_sticky_apply_ledger_pins.json` holds each row's words where they now
live, each changed rule's whole paragraph, the homes paragraph by paragraph
(`preferences.md` -> How Much Fits in One Lesson, Starters, Sticky Knowledge,
The Apply Slide, Practising a Test Question and Purposeful Endings, and the
lesson designer's Starter, Sticky Knowledge and Apply Slide), the retired
wordings as gone in any case, and the rows of the rest-of-preferences list 7A
changed. The fix for a failure here is to update the ledger and the pins on
purpose, with the teacher's say-so.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ledger_pin_checks import ROOT, flat, make_ledger_tests, section_by_heading  # noqa: E402

PINS = Path(__file__).resolve().with_name("starters_sticky_apply_ledger_pins.json")
LEDGER = ROOT.parents[1] / "plans" / "2026-09-23-starters-sticky-apply-ledger.md"
PREF = ROOT / "references" / "preferences.md"
LD = ROOT / "agents" / "lesson-designer.md"

EveryStartersStickyApplyRowIsStillInItsHome = make_ledger_tests(PINS, LEDGER, "SA", 390)


def text(rel: str) -> str:
    return flat((ROOT / rel).read_text(encoding="utf-8"))


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TheTeachersDecisionsAreWritten(unittest.TestCase):
    def test_the_test_question_starter_is_gone_as_if_it_never_existed(self) -> None:
        """Settled item 1: "it needs to be like it didnt even exist"."""
        for rel in ("references/output-template.md", "scripts/validate-lesson-design.py",
                    "scripts/lesson-design-scaffold.py", "references/templates.md",
                    "builder/src/templates/starter-question-tall.js"):
            with self.subTest(file=rel):
                self.assertNotIn("testQuestionPath", text(rel))
                self.assertNotIn("scanned question", text(rel))
        # The live rule for a real question from an upcoming test stays, and its
        # short copies carry both exceptions (settled item 2, "keep with small fix").
        test = section_by_heading(PREF, "## Practising a Test Question", 0)
        self.assertIn("If the teacher explicitly asks to teach or review that exact held item, honour the request", test)
        self.assertIn("may still be used when it is not being held for later assessment", test)
        self.assertIn("the real item stays out of the lesson while it is held for a later test, unless the teacher explicitly asks for that exact item", text("references/preferences.md"))
        self.assertIn("with fresh content while the real item is held for a later test, unless the teacher explicitly asks for that exact item; a suitable real question that is not being held may be used itself", text("agents/design-reviewer.md"))

    def test_the_lesson_2_plan_is_gone_and_a_split_is_said_in_one_line(self) -> None:
        """PF decision 20: "it already knows how much it can fit in one lesson"."""
        fit = section_by_heading(PREF, "## How Much Fits in One Lesson", 0)
        self.assertIn("says in one line of the walk-through's closing decisions what it left for another lesson; it does not plan that lesson", fit)
        self.assertIn("ending on the lesson's core idea while it is still fresh.", fit)
        self.assertNotIn("the opening of the next lesson", fit)
        self.assertNotIn("know how a Roman lived", fit)
        self.assertIn("If it left something out, say what in one line of the walk-through's closing decisions; never plan the next lesson.", text("agents/lesson-designer.md"))
        # The walk-through's closing decision the one line belongs to is unchanged.
        self.assertIn("the approved objective, exact end performance, approved curriculum boundary for today and related content deliberately deferred", text("agents/lesson-designer.md"))

    def test_a_question_about_today_opens_only_in_the_two_cases(self) -> None:
        """Decision 3: "Yes"."""
        starters = section_by_heading(PREF, "## Starters", 0)
        self.assertIn("a question the lesson will answer opens instead only in the two cases above", starters)
        self.assertIn("which stays a question children think and talk about, never a prediction or the task explained", starters)

    def test_nothing_prints_under_starter_but_a_heading_it_carries(self) -> None:
        """Settled item 4, on his ruling "Just the starter heading that's underlined is enough"."""
        catalogue = text("references/templates.md")
        self.assertIn("A `title` never prints there, because the teacher wants the underlined heading alone: \"Just the starter heading that's underlined is enough.\"", catalogue)
        self.assertNotIn("Give the slide a `title` (or a `heading`) as normal", catalogue)

    def test_sticky_knowledge_is_written_once_and_a_listed_fact_is_judged(self) -> None:
        """The fold, and settled item 5."""
        home = section_by_heading(PREF, "## Sticky Knowledge", 0)
        for words in ("so trace each one forward to the stage that needs it",
                      "A sticky fact is not where an idea goes",
                      "A fact that would reveal the thinking a later task requires is left off that task, unless the task genuinely needs it as a reference.",
                      "the Apply and the working wall, where it is shortened only when it genuinely cannot fit, and then is still a whole sentence a teacher would say"):
            with self.subTest(words=words[:40]):
                self.assertIn(words, home)
        designer = section_by_heading(LD, "### Sticky Knowledge", 0)
        self.assertIn("`preferences.md` → Sticky Knowledge is the home", designer)
        self.assertIn("When the teacher's plan lists sticky facts, judge them like anything else it offers, and keep one the teacher marks as required.", designer)
        self.assertNotIn("Teacher may provide - use it.", designer)
        self.assertNotIn("Not teaching tool", designer)

    def test_a_sticky_fact_usually_leads_and_is_never_a_caption(self) -> None:
        """Settled item 6, turned round: no fixed rule for where it sits."""
        route = text("references/teaching-sequence-content-based.md")
        self.assertIn("**The landed sentence usually leads the board.**", route)
        self.assertIn("that is how this teacher usually explains, not a rule for every slide", route)
        self.assertIn("the top line is never a caption of the picture", route)
        self.assertIn("a choice wherever the fact reads better last", route)
        self.assertIn("never a description of the picture", route)
        self.assertIn("write it once, as the headline or as the star line, never both", text("agents/lesson-designer.md"))

    def test_the_wall_keeps_the_lessons_sentences_whole(self) -> None:
        """Decision 7 and PF decision 22's wording half: room first, a whole sentence always."""
        wall = text("agents/working-wall-designer.md")
        self.assertIn("Making room is the *first* move when an item overruns, not the last", wall)
        self.assertIn("So does a sticky-knowledge statement.", wall)
        self.assertNotIn("a worked-example modelled sentence, a sticky-knowledge statement, a sentence stem's framing", wall)
        prefs = text("references/working-wall-preferences.md")
        self.assertIn("A sticky-knowledge fact is the same: the lesson's own words, shortened only when they genuinely cannot fit", prefs)
        self.assertIn("about 106 characters", prefs)
        self.assertNotIn("Condense first", prefs)

    def test_a_lesson_that_named_an_idea_says_where_it_met_a_new_case(self) -> None:
        """Decision 9: "yes"; the reviewer's routing card reads the Apply rules then."""
        apply = section_by_heading(PREF, "## The Apply Slide", 0)
        self.assertIn("one that named an idea says where the idea met a case it was not taught on", apply)
        designer = section_by_heading(LD, "### Apply Slide", 0)
        self.assertIn("For a lesson whose learning is a fact or a method, \"Your Turn and answers is sufficient AFL here - no distinct synthesis task is needed\" is complete justification.", designer)
        packet = load("design_review_packet_7a", "design-review-packet.py")
        trigger = dict(packet.PREFERENCE_REVIEW_ROUTES)["The Apply Slide"]
        self.assertEqual(
            trigger,
            "Read when Apply may be unearned or repeat Your Turn, and when a lesson that named an idea has no "
            "Apply and its reason does not say where the idea met a case it was not taught on.",
        )

    def test_maths_titles_and_practise(self) -> None:
        """PF settled item 1 and decision 21."""
        self.assertIn("`Practise`, and `Apply` outside maths", text("agents/slide-designer.md"))
        self.assertIn("`Apply` outside maths, where the teacher wants the plain words", text("agents/lesson-designer.md"))
        self.assertIn("`Apply` outside maths, where the teacher wants the plain words", text("agents/design-reviewer.md"))
        self.assertNotIn("'Independent Tasks'", text("builder/src/templates/grid-calc.js"))

    def test_the_reviewer_reads_the_always_read_sections(self) -> None:
        """The contents paragraph (PF-A29) and the Pride Lessons note (PF-X46), settled item 14."""
        self.assertIn("it reads the sections the card marks as always read in every review", text("references/preferences.md"))
        packet = load("design_review_packet_7a_pride", "design-review-packet.py")
        notes = {heading: why for _name, heading, why in packet.ALWAYS_READ_REVIEW_SECTIONS}
        self.assertIn("holds the Teach slides the teacher chose, written out", notes["Pride Lessons (Quality Anchor)"])


if __name__ == "__main__":
    unittest.main()
