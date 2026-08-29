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
