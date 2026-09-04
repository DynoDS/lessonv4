from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AGENT = (ROOT / "agents" / "adaptation-designer.md").read_text(encoding="utf-8")
WORKSHEET_DESIGNER = (ROOT / "agents" / "worksheet-designer.md").read_text(
    encoding="utf-8"
)
ADAPTIVE = (ROOT / "references" / "adaptive-adaptation.md").read_text(
    encoding="utf-8"
)
PREFERENCES = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
SUBJECT_MATHS = (ROOT / "references" / "subject-maths.md").read_text(
    encoding="utf-8"
)
MAKE_LESSON = (
    (ROOT / "skills" / "make-lesson" / "SKILL.md").read_text(encoding="utf-8")
    + "\n"
    + (ROOT / "skills" / "make-lesson" / "playbook-lite.md").read_text(encoding="utf-8")
)

RUNTIME_CONTRACTS = {
    "agents/adaptation-designer.md": AGENT,
    "agents/worksheet-designer.md": WORKSHEET_DESIGNER,
    "references/adaptive-adaptation.md": ADAPTIVE,
    "references/preferences.md": PREFERENCES,
    "references/subject-maths.md": SUBJECT_MATHS,
    "skills/make-lesson/SKILL.md": MAKE_LESSON,
}

LEGACY_TERMS = (
    "CHILD Z",
    "CHILD X",
    "Child Z",
    "Child X",
    "Z/X",
    "Z or X",
    "Z and X",
    "Z's",
    "X's",
    "Read it as Z",
    "read it as X",
    "Stretch for the greater depth child",
    "Task shape:\nopen-task",
    "No generated adaptation needed",
)


class AdaptationArchitectureContractTests(unittest.TestCase):
    def test_legacy_learner_labels_are_absent_from_runtime_contracts(self) -> None:
        for path, text in RUNTIME_CONTRACTS.items():
            for term in LEGACY_TERMS:
                with self.subTest(path=path, term=term):
                    self.assertNotIn(term, text)

    def test_adaptation_output_uses_canonical_sections_and_decisions(self) -> None:
        self.assertIn(
            "**`adaptation.md`** — one markdown file with two sections: "
            "`## Greater Depth` and `## Below`. Written to "
            "`WORKING_DIR/adaptation.md`.",
            AGENT,
        )
        self.assertIn(
            "Resource decision: [Use Expected unchanged / "
            "Generate separate Greater Depth adaptation]",
            AGENT,
        )
        self.assertIn(
            "Resource decision: [Use Expected unchanged / "
            "Generate separate Below adaptation]",
            AGENT,
        )
        self.assertIn(
            "Where no separate resource is needed, record the applicable "
            "`Resource decision: Use Expected unchanged` value and the reason.",
            AGENT,
        )

    def test_output_fields_and_photo_contract_are_preserved(self) -> None:
        for field in (
            "Resource decision:",
            "Reason:",
            "LO:",
            "Task form:",
            "Pupil prompt:",
            "Response:",
            "Support:",
            "Visual requirements:",
            "Photo refs:",
            "Fit priority:",
            "Page budget check:",
            "Answers for Greater Depth:",
            "Selected tier:",
            "Evidence or basis for tier:",
            "Class LO:",
            "Below objective:",
            "Working level used:",
            "Connection to class learning:",
            "Next-step objective:",
            "Support and representation decision:",
            "Reading-access check:",
            "Answers for Below:",
        ):
            with self.subTest(field=field):
                self.assertIn(field, AGENT)

        self.assertIn("## Photos for the sheets", AGENT)
        self.assertIn("fenced `json` code block", AGENT)
        self.assertIn("adaptation-photo-001", AGENT)
        self.assertIn("check-photo-cap.py", MAKE_LESSON)
        self.assertIn("build-provisional", MAKE_LESSON)
        self.assertIn("select-worksheet", MAKE_LESSON)
        self.assertIn("promote-used", MAKE_LESSON)

    def test_fit_priority_is_priced_against_the_page_before_it_is_closed(self) -> None:
        """A protected set nobody counted is how a sheet reaches the worksheet
        designer 60mm over a page with no removal authorised, and comes back."""
        self.assertIn("Page budget check", AGENT)
        self.assertIn("250mm", AGENT)
        self.assertIn("preferences.md", AGENT)
        self.assertIn(
            "refusing to name a removal order does not save the content",
            AGENT,
        )
        preferences = (ROOT / "references" / "preferences.md").read_text(encoding="utf-8")
        worksheets = preferences.split("## Worksheets", 1)[1].split("\n## ", 1)[0]
        self.assertIn("Price the protected set against the page", worksheets)
        self.assertIn("250mm", worksheets)
        self.assertIn("165mm", worksheets)
        self.assertIn(
            '"Nothing may be removed" is a claim about a sheet that already fits',
            worksheets,
        )

    def test_teacher_provided_and_shared_frame_routes_are_preserved(self) -> None:
        flat = " ".join(MAKE_LESSON.split())
        self.assertIn('worksheet.status == "provided-by-teacher"', AGENT)
        self.assertIn(
            'worksheet.status == "provided-by-teacher"',
            WORKSHEET_DESIGNER,
        )
        self.assertIn("shared-frame", AGENT)
        self.assertIn("`shared-frame`: skip Adaptation Designer", flat)
        self.assertIn(
            "teacher-provided expected worksheet: consider adaptation but do "
            "not generate a second expected sheet",
            flat,
        )
        self.assertIn(
            "Never infer this route from old Markdown status text.",
            flat,
        )
        self.assertNotIn("three-sheet fan-out", MAKE_LESSON)

    def test_greater_depth_practice_is_not_depth_by_itself(self) -> None:
        sentence = (
            "Fresh same-objective practice may be included when it improves "
            "case coverage, but harder numbers, extra quantity or a changed "
            "surface representation do not by themselves create Greater Depth."
        )
        for path, text in (
            ("agents/adaptation-designer.md", AGENT),
            ("references/adaptive-adaptation.md", ADAPTIVE),
            ("references/subject-maths.md", SUBJECT_MATHS),
        ):
            with self.subTest(path=path):
                self.assertIn(sentence, text)

    def test_rules_are_contiguous_and_resource_based(self) -> None:
        rules = AGENT.split("## Rules That Never Change", 1)[1].split(
            "\n---\n",
            1,
        )[0]
        numbers = re.findall(r"(?m)^(\d+)\. \*\*", rules)
        self.assertEqual(numbers, [str(number) for number in range(1, 9)])
        self.assertIn(
            "**Greater Depth stays on the class objective and within "
            "year-group content.**",
            rules,
        )
        self.assertIn(
            "**Do not change the class lesson or Expected resource.**",
            rules,
        )

    def test_readback_uses_resource_vantages(self) -> None:
        self.assertIn(
            "### Read the Greater Depth work, then the Below work",
            AGENT,
        )
        self.assertIn(
            "List from the adaptation: any Greater Depth practice or task "
            "and any Below task.",
            AGENT,
        )
        self.assertIn(
            "A fault that lives entirely inside the class lesson goes in the "
            "output notes under rule 8",
            AGENT,
        )

    def test_worksheet_handoff_uses_task_form(self) -> None:
        self.assertIn("`Task form: open task`", WORKSHEET_DESIGNER)
        self.assertNotIn("Task shape:", WORKSHEET_DESIGNER)
        self.assertNotIn("open-task", WORKSHEET_DESIGNER)

    def test_orchestrator_launch_gives_adaptation_designer_its_inputs(
        self,
    ) -> None:
        spawn = MAKE_LESSON.split("**Adaptation Designer**", 1)[1].split(
            "**Worksheet Designer**",
            1,
        )[0]
        flat = " ".join(spawn.split())
        self.assertIn("approved lesson design", flat)
        self.assertIn("teacher worksheet when supplied", flat)
        self.assertIn("teacher brief/clarifications", flat)
        self.assertIn("frozen initial photo contract", flat)
        self.assertIn(
            "It owns `adaptation.md` and, through it, a provisional "
            "adaptation photo contract.",
            flat,
        )
        self.assertNotIn("Also read these reference files at the start:", spawn)
        self.assertIn("## Greater Depth", AGENT)
        self.assertIn("## Below", AGENT)

    def test_every_photo_contract_command_reads_the_file_the_designer_writes(
        self,
    ) -> None:
        """The adaptation document has one name, and the commands must use it.

        The playbook told the photo-contract step to read `adaptation.json`
        while the adaptation-designer wrote `adaptation.md`. The extractor found
        no markdown section in a JSON file and reported zero adaptation photos,
        so three requested pictures were dropped in silence and the Below sheet
        that referenced them was omitted.
        """
        self.assertIn("`adaptation.md`", AGENT)
        self.assertNotIn("adaptation.json", AGENT)

        arguments = [
            line.strip()
            for line in MAKE_LESSON.splitlines()
            if line.strip().startswith("--adaptation ")
        ]
        self.assertTrue(arguments, "the playbook runs no --adaptation command")
        for argument in arguments:
            self.assertIn("adaptation.md", argument)
            self.assertNotIn("adaptation.json", argument)

    def test_promoted_adaptation_pictures_get_their_own_scout_wave(self) -> None:
        """Adaptation pictures are compiled after the Phase 2 wave has closed.

        Promoting them into the contract is not sourcing them: without a second
        wave every adaptation picture is promised to the worksheet and never
        attempted.
        """
        wave = MAKE_LESSON.split("**The supplemental picture wave**", 1)
        self.assertEqual(len(wave), 2, "no supplemental picture wave in the playbook")
        section = wave[1].split("Build worksheets directly", 1)[0]
        self.assertIn("compile-picture-assignments.py", section)
        self.assertIn("--expected-prefix w", section)
        self.assertIn("--expected-filename", section)
        self.assertIn("PICTURE_ASSIGNMENTS_OK", section)
        self.assertIn("PICTURE_MANIFEST_OK", section)
        self.assertIn("image-scout", section)
        self.assertIn("PICTURE_RESULT_OK", section)
        self.assertIn("finalize-picture-assignment.py", section)
        self.assertIn("Track B trigger", section)

    def test_preferences_and_maths_reference_use_resource_vocabulary(self) -> None:
        self.assertIn(
            "the adaptation-designer draws on them for a generated "
            "Greater Depth resource",
            PREFERENCES,
        )
        self.assertIn("## Default Working-Level Gap", ADAPTIVE)
        self.assertIn("## Greater Depth in maths", SUBJECT_MATHS)
        self.assertIn(
            "before making the Greater Depth and Below resource decisions",
            SUBJECT_MATHS,
        )


if __name__ == "__main__":
    unittest.main()


class AdaptationPictureReuseTests(unittest.TestCase):
    """Reusing a picture must not give one filename two identities.

    On 3 September 2026 a Year 4 history adaptation wanted a photograph the
    Lesson Designer had already contracted as `photo-005`. It re-declared that
    filename in its own `Photos for the sheets` block as
    `adaptation-photo-001`, the contract merge refused
    ("same filename has different id"), and the whole Below sheet was dropped
    over a picture the lesson already had. The agent said reuse was allowed but
    never said how to do it, and the item template offered only
    `adaptation-photo-###` ids to name.
    """

    def flat(self, text: str) -> str:
        return " ".join(text.split())

    def test_reuse_is_by_naming_the_existing_id(self) -> None:
        agent = self.flat(AGENT)
        self.assertIn(
            "Reuse means naming the picture that already exists, not describing "
            "it again.",
            agent,
        )
        self.assertIn(
            "is reused by putting that ID in the item's `Photo refs` and "
            "leaving the block alone",
            agent,
        )

    def test_the_photo_refs_line_accepts_an_initial_picture_id(self) -> None:
        """The template that only offered adaptation ids is what forced the
        re-declaration, so it has to name both namespaces."""
        self.assertIn(
            "- Photo refs: [photo-### or adaptation-photo-### IDs used by this "
            "item, or None]",
            AGENT,
        )
        self.assertNotIn(
            "- Photo refs: [adaptation-photo-### IDs used by this item, or None]",
            AGENT,
        )

    def test_a_genuinely_different_constraint_earns_a_new_filename(self) -> None:
        """The boundary: reuse is for the same picture doing the same job."""
        self.assertIn(
            "give it a new filename as well as a new ID",
            self.flat(AGENT),
        )


class BelowRouteTests(unittest.TestCase):
    """The Below route is chosen from the lesson, and it climbs.

    Every maths lesson built between 1 and 4 September 2026 came back at Tier 2
    on the same reasoning: no pupil assessment evidence was supplied, therefore
    the class objective could not be retained. The teacher had typed a year
    group and a topic, which is every run this pipeline ever gets, so absence of
    pupil information had quietly become the standard argument for dropping two
    years. `Find 10 and 100 more or less` reached a child as five two-digit
    questions that never rose above 90; the class was working in thousands.

    The research the teacher supplied on 4 September 2026 named the missing
    route: keep the idea, enter it at a smaller scale, and climb back to a
    class-sized case on the same sheet, so a below-working child meets what the
    class met. It also named the foundation-subject version of the same fault,
    where the subject drains out of an accessible task until naming and
    labelling are left.
    """

    def test_the_tier_is_decided_from_the_lesson_not_from_missing_pupil_data(self) -> None:
        self.assertIn(
            "Absence of pupil information is not a reason to lower the objective.",
            ADAPTIVE,
        )
        # The decision that replaces it: which half of the lesson is hard.
        for text in (ADAPTIVE, AGENT):
            self.assertIn("the way in", text)
        self.assertIn("Start at Tier 1", AGENT)
        self.assertIn("Start at Tier 1 and move only for a reason you can name", ADAPTIVE)

    def test_the_protected_idea_is_named_before_the_tier_is_chosen(self) -> None:
        self.assertIn("Protected idea:", AGENT)
        self.assertIn("## What the lesson protects", ADAPTIVE)
        # Named before the tier so every later choice can be checked against it.
        self.assertLess(
            AGENT.index("Protected idea:"),
            AGENT.index("Selected tier:"),
            "the protected idea is named before the tier decision, not after it",
        )

    def test_a_tier_2_resource_climbs_to_a_class_sized_case(self) -> None:
        self.assertIn("Climb:", AGENT)
        for text in (ADAPTIVE, AGENT):
            with self.subTest(doc=text[:40]):
                self.assertIn("class-sized", text)
        # Stopping at the smaller scale is the fault the tier exists to prevent.
        self.assertIn(
            "A Tier 2 resource that never reaches a class-sized case is refused work",
            AGENT,
        )

    def test_a_tier_3_resource_still_points_at_the_class_lesson(self) -> None:
        self.assertIn("Reaches towards:", AGENT)
        self.assertIn("parallel", AGENT)

    def test_the_final_reaching_item_is_not_the_cheap_thing_to_cut(self) -> None:
        """It is last on the sheet, so it is first in line when the page runs
        short, and cutting it returns the resource to parallel work."""
        self.assertIn("essential and protected", AGENT)
        self.assertIn("Something earlier in the run goes first.", AGENT)

    def test_the_maths_ladder_is_named_as_the_exception_not_the_rule(self) -> None:
        """Discrimination. Smaller numbers are a real route in maths and have no
        equivalent in history: without this, Tier 2 over-fires everywhere."""
        self.assertIn("Scale is a maths ladder, and most subjects have no ladder", ADAPTIVE)
        for text in (ADAPTIVE, AGENT):
            with self.subTest(doc=text[:40]):
                self.assertIn("no Year 2 version of the Romans", text)

    def test_an_accessible_task_that_lost_the_subject_is_still_wrong(self) -> None:
        """The foundation-subject fault: a real science sheet moved `balanced
        diet` to `choose foods and say how they help the body`, keeping the food
        and losing the balance."""
        self.assertIn("balanced", ADAPTIVE)
        self.assertIn(
            "does the pupil come away carrying that idea?",
            AGENT,
        )

    def test_the_worksheet_designer_does_not_shuffle_the_climb(self) -> None:
        """A climb is a rising run of answers, which is precisely the shape
        rule 8 tells the designer to break up. The exception named only the
        lesson-designer, and a Below sheet's order comes from the adaptation."""
        self.assertIn("an upstream designer", WORKSHEET_DESIGNER)
        self.assertNotIn(
            "The exception is a sequence the lesson-designer", WORKSHEET_DESIGNER
        )
        self.assertIn("`Climb:`", WORKSHEET_DESIGNER)
        self.assertIn("never trim them to fit", WORKSHEET_DESIGNER)

    def test_the_climb_says_where_on_the_sheet_it_lives(self) -> None:
        """"Its last piece of work is class-sized" left three readings open on a
        sheet with practice, reasoning and problem solving: does every section
        climb, does the whole sheet, is the reasoning question class-sized? The
        teacher asked which, on 4 September 2026, and the answer was not there.
        """
        self.assertIn("The climb lives in the practice run.", AGENT)
        # Reasoning is not the top of the ladder: that tests two things at once.
        self.assertIn(
            "Reasoning sits at a scale the child already owns, not at the top of the climb.",
            AGENT,
        )
        # And the class-sized item is one question, not a section.
        self.assertIn("It is one question, not a section", AGENT)

    def test_an_adaptation_names_the_barrier_before_it_changes_anything(self) -> None:
        """A sheet with every dial turned at once cannot be read: a child who
        succeeds proves nothing and a child who fails names nothing."""
        self.assertIn("turn only the dial that matches it", AGENT)
        for barrier in ("Reading", "Holding the steps", "Abstraction", "Amount"):
            with self.subTest(barrier=barrier):
                self.assertIn(barrier, AGENT)
        self.assertIn("not all six", AGENT)

    def test_a_foundation_subject_sheet_keeps_its_subject(self) -> None:
        """The dials are allowed to do a great deal to a history sheet. What
        they may not do is leave a page a child could finish knowing nothing
        about the topic."""
        self.assertIn(
            "the one thing they never touch is the subject", AGENT
        )
        self.assertIn(
            "completed by a child who knows nothing about the topic", AGENT
        )
