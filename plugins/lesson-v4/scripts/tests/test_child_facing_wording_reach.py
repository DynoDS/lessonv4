from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PREFERENCES = ROOT / "references" / "preferences.md"
STICK_IN_PEDAGOGY = ROOT / "references" / "stick-in-sheets-pedagogy.md"
WALL_DESIGNER = ROOT / "agents" / "working-wall-designer.md"
STICK_IN_DESIGNER = ROOT / "agents" / "stick-in-sheets-designer.md"
WORKSHEET_DESIGNER = ROOT / "agents" / "worksheet-designer.md"
LESSON_DESIGNER = ROOT / "agents" / "lesson-designer.md"
OUTPUT_TEMPLATE = ROOT / "references" / "output-template.md"


def flat(path: Path) -> str:
    return " ".join(path.read_text(encoding="utf-8").split())


class ChildFacingWordingReachTests(unittest.TestCase):
    def test_plain_prompt_habits_cover_every_printed_surface(self) -> None:
        """A child reads a wall card and a stick-in piece unaided too.

        These three habits were written as worksheet rules, so a planning name
        such as `the balance rule` was barred from a sheet and allowed onto a
        card that stays on the wall for weeks. The register paragraph sits in
        Written Voice, which every designer already reads, so the repair is to
        widen the one rule rather than copy it into each designer file.
        """
        preferences = flat(PREFERENCES)

        self.assertIn(
            "Three habits keep any printed child-facing wording plain, on a "
            "worksheet, a stick-in piece or a wall card alike",
            preferences,
        )
        self.assertNotIn(
            "Three habits keep worksheet prompts plain", preferences
        )

        # The habits themselves must still be the ones that were widened.
        for habit in (
            "An instruction is a short imperative",
            "A prompt never lists choices the page already prints",
            "never reaches the child",
        ):
            with self.subTest(habit=habit):
                self.assertIn(habit, preferences)

    def test_every_child_facing_designer_reads_written_voice(self) -> None:
        """Widening the rule only works if these designers load the section."""
        for path in (WALL_DESIGNER, STICK_IN_DESIGNER, WORKSHEET_DESIGNER):
            with self.subTest(agent=path.name):
                self.assertIn("Written Voice", flat(path))

    def test_designer_set_response_space_is_counted_from_the_demand(
        self,
    ) -> None:
        """The stick-in builder sizes its pieces; one piece is the exception.

        `geographical-description-frame` lets the designer set the number of
        writing lines, which is the same undercounting fault the worksheet
        rules already name, so the count rule sits beside that spec.
        """
        pedagogy = flat(STICK_IN_PEDAGOGY)
        self.assertIn(
            "This is the one piece whose response space you set rather than "
            "the builder",
            pedagogy,
        )
        self.assertIn("at the width it prints", pedagogy)

    def test_written_voice_reaches_every_field_a_child_reads(self) -> None:
        """A child reads the words, not the field name.

        The full-strength wording rule named only `pupilInstruction` and
        `pupilPrompt`, so the worksheet `generator` - which downstream prints
        verbatim as the task - was governed by nothing. A real Year 4 class met
        `Choose a job that is different from the lesson examples.` and answered
        "Fireman".
        """
        lesson_designer = flat(LESSON_DESIGNER)
        self.assertIn(
            "every field whose words a child actually reads", lesson_designer
        )
        # The fields that print verbatim must be named, or the rule is a
        # principle nobody can apply to a specific field.
        for field in ("generator", "stimulus", "pupilAction", "support"):
            with self.subTest(field=field):
                self.assertIn(field, lesson_designer)

    def test_the_slide_fields_that_print_to_the_class_are_named(self) -> None:
        """Two board fields print verbatim and neither was on the list.

        `content.example` on a My Turn is what the whiteboard shows while the
        teacher models, and a real Year 4 deck showed the class `Begin with one
        clip deliberately left loose, trace the broken path`. `answer.content`
        under `answer-slide` delivery is the reveal children read, and the same
        deck showed them `A clear labelled pictorial drawing that matches the
        chosen working circuit`. Both were written to the teacher because
        nothing said they were read by anyone else.
        """
        lesson_designer = flat(LESSON_DESIGNER)

        self.assertIn("content.example", lesson_designer)
        self.assertIn(
            "IS what the board carries while you model", lesson_designer
        )
        # The stage directions need somewhere to go, or the rule just deletes
        # information the teacher needs.
        self.assertIn("belong in speakerNotes", lesson_designer)

        self.assertIn("answer.content", lesson_designer)
        self.assertIn(
            "the answer a child would say out loud", lesson_designer
        )
        self.assertIn(
            "acceptanceCondition` is where marking language lives",
            lesson_designer,
        )

    def test_generative_tasks_name_their_category(self) -> None:
        """`Choose a job` asks a child to invent an abstraction."""
        self.assertIn(
            "A generative task names the category it is generating from",
            flat(LESSON_DESIGNER),
        )

    def test_the_worked_first_example_is_documented(self) -> None:
        """`firstRowWorked` existed in the schema with no guidance anywhere.

        A field nobody explains is a field nobody fills, and this is the one
        that would have shown a child what kind of thing to generate.
        """
        template = flat(OUTPUT_TEMPLATE)
        self.assertIn("firstRowWorked", template)
        self.assertIn(
            "one complete worked example of the thing being generated", template
        )
        # And the surface that produced `Name:` from a planning note.
        self.assertIn("it is NOT printed", template)

    def test_authoring_a_label_loads_the_label_rule(self) -> None:
        """Inventing a label from a described surface IS authoring."""
        worksheet = flat(WORKSHEET_DESIGNER)
        self.assertIn("writing a label counts", worksheet)
        self.assertIn(
            "A label children answer against is the question a child would ask "
            "themselves",
            worksheet,
        )


if __name__ == "__main__":
    unittest.main()
