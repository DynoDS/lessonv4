"""The subject-files release (topic 8, release 1), step 5: the tests.

- `test_diet_and_safety_content_boundaries.py`: the four tests on PSHE's food
  rules become one (decision 6): both subject files carry the Eatwell pointer,
  and no subject file carries the rules' own sentences. The bar is on the
  subject files only, because the reviewer's example legitimately keeps
  `explain why the whole lunch is balanced` (`test_reviewer_voice_authority.py`).
- `ledger_pin_checks.py`, two changes every topic's pin test shares:
  a pin marked `fileRemoved` (a phrase whose whole file the teacher removed)
  holds by that file staying gone, and fails if it comes back; and a home that
  is the last section of its file is read to the file's end. The second is the
  same change, line for line, as the worksheets release (4.2.290) makes, so the
  two merge as one.
- `test_vocabulary_ledger_is_kept.py`, which carries the checks inline, learns
  the same `fileRemoved` pin.
- `test_subject_files_ledger_is_kept.py` is placed from `new/`: the shared
  checks over the pin file and a test per decision.
"""
from pathlib import Path

from _patch import ROOT, TESTS, assert_absent, read, replace_once

NEW = Path(__file__).resolve().parent / "new"

DIET_OLD = '''class DietContentBoundaryTests(unittest.TestCase):
    """The Y4 balanced-diet lesson (4.2.34, 31 Aug 2026) avoided food
    moralising and then rebuilt the concept wrongly: the task asked children
    to prove one lunch balanced, a success criterion invented `Add two fruit
    or vegetable portions.`, and the three body jobs became the definition of
    balance. Eatwell frames balance as variety in proportion over a day or
    week, with no per-meal portion rules.
    """

    def test_balance_is_judged_over_time_not_per_meal(self) -> None:
        pshe = flat(PSHE)
        self.assertIn(
            "Balance is a property of eating over time, never of one meal.",
            pshe,
        )
        self.assertIn("Eatwell Guide", pshe)
        self.assertIn("explain why the whole lunch is balanced", pshe)
        # The task shapes a meal genuinely supports.
        self.assertIn("plan or improve a meal", pshe)

    def test_per_meal_quotas_are_named_as_the_misconception(self) -> None:
        pshe = flat(PSHE)
        self.assertIn("No invented per-meal quotas.", pshe)
        self.assertIn("Add two fruit or vegetable portions", pshe)
        self.assertIn("the apple misconception wearing better clothes", pshe)

    def test_body_jobs_stay_a_scaffold_not_the_definition(self) -> None:
        pshe = flat(PSHE)
        self.assertIn(
            "teaching scaffold, not the definition of balance", pshe
        )
        self.assertIn("replaced the concept with its scaffold", pshe)

    def test_food_stays_neutral_and_processing_stays_in_proportion(self) -> None:
        pshe = flat(PSHE)
        self.assertIn("no good or bad food labels", pshe)
        self.assertIn("not automatically unhealthy", pshe)
        self.assertIn("said once and in proportion, not run as a theme", pshe)
'''

DIET_NEW = '''class DietContentBoundaryTests(unittest.TestCase):
    """The Y4 balanced-diet lesson (4.2.34, 31 Aug 2026) avoided food
    moralising and then rebuilt the concept wrongly: the task asked children
    to prove one lunch balanced, a success criterion invented `Add two fruit
    or vegetable portions.`, and the three body jobs became the definition of
    balance. Four food rules went into the PSHE file for it.

    On 24 September 2026 the teacher took them out ("those balanced diet
    things sound like things I wouldnt want in the pshe subject files") and
    asked for a pointer instead ("maybe the subject file could say to look for
    guidance from eatwell guide thing"), then said "yes" to the same line in
    science, which teaches diet too and never reads the PSHE file. What reaches
    a diet lesson another way stays where it is: the reviewer's single-lunch
    example, the food plate's caption and its ban on good and bad foods, and
    the rule against an invented count in a criterion (below).
    """

    EATWELL = (
        "A lesson about food, diet or healthy eating follows the NHS Eatwell "
        "Guide for what a balanced diet is and how it is shown."
    )

    def test_pshe_and_science_point_to_the_eatwell_guide_and_nothing_more(self) -> None:
        for path in (PSHE, SCIENCE):
            with self.subTest(file=path.name):
                self.assertIn("## Food and diet " + self.EATWELL, flat(path))
        # The rules' own sentences are gone from every subject file, where
        # they were design rules. The reviewer keeps its single-lunch example,
        # so the bar is on the subject files, not the whole plugin.
        for path in sorted((ROOT / "references").glob("subject-*.md")):
            text = flat(path)
            for phrase in (
                "Diet lessons recur in every primary year",
                "Balance is a property of eating over time, never of one meal.",
                "explain why the whole lunch is balanced",
                "No invented per-meal quotas.",
                "the apple misconception wearing better clothes",
                "teaching scaffold, not the definition of balance",
                "replaced the concept with its scaffold",
                "no good or bad food labels",
                "not automatically unhealthy",
                "said once and in proportion, not run as a theme",
            ):
                with self.subTest(file=path.name, phrase=phrase):
                    self.assertNotIn(phrase, text)
'''

replace_once(f"{TESTS}/test_diet_and_safety_content_boundaries.py", DIET_OLD, DIET_NEW)
assert_absent(f"{TESTS}/test_diet_and_safety_content_boundaries.py", "def test_balance_is_judged_over_time_not_per_meal")

replace_once(
    f"{TESTS}/ledger_pin_checks.py",
    '''                    own = ROOT / pin["file"]
                    files = sorted(set(RUNTIME) | set(PROGRAMS) | {own}) if pin.get("everywhere") else [own]
''',
    '''                    own = ROOT / pin["file"]
                    if pin.get("fileRemoved"):
                        # The teacher removed the phrase's whole file: the
                        # phrase stays gone while the file does, and the file
                        # coming back fails here.
                        with self.subTest(row=row["id"], file=pin["file"], removed=True):
                            self.assertFalse(own.exists(), "a file the teacher removed is back")
                    files = sorted(set(RUNTIME) | set(PROGRAMS) | {own}) if pin.get("everywhere") else [own]
                    files = [path for path in files if path.exists() or not pin.get("fileRemoved")]
''',
)
HOMES_TO_THE_END = '''                end = next((i for i in range(start + 1, len(lines))
                            if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level),
                           len(lines))
                body = "\\n".join(lines[start + 1:end]).split("\\n\\n")
'''
if HOMES_TO_THE_END in read(f"{TESTS}/ledger_pin_checks.py"):
    # Replayed on a tree that already holds the worksheets release.
    print("a home read to its file's end: already there (4.2.290 makes the same change)")
else:
    replace_once(
        f"{TESTS}/ledger_pin_checks.py",
        '''                end = next(i for i in range(start + 1, len(lines))
                           if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)
                body = "\\n".join(lines[start + 1:end]).split("\\n\\n")
''',
        HOMES_TO_THE_END,
    )

# The vocabulary topic's test carries the same checks inline, so it learns the
# same `fileRemoved` pin (VOC-M15 is one).
replace_once(
    f"{TESTS}/test_vocabulary_ledger_is_kept.py",
    '''            for pin in row["absent"]:
                # "Everywhere" is the instructions and the programs whose messages
''',
    '''            for pin in row["absent"]:
                if pin.get("fileRemoved"):
                    # The teacher removed the phrase's whole file: it stays
                    # gone while the file does, and the file coming back fails.
                    with self.subTest(row=row["id"], file=pin["file"], removed=True):
                        self.assertFalse((ROOT / pin["file"]).exists(), "a file the teacher removed is back")
                    continue
                # "Everywhere" is the instructions and the programs whose messages
''',
)

target = ROOT / TESTS / "test_subject_files_ledger_is_kept.py"
assert not target.exists()
source = (NEW / "test_subject_files_ledger_is_kept.py").read_text(encoding="utf-8")
with open(target, "w", encoding="utf-8", newline="\n") as handle:
    handle.write(source)
print("tests changed and placed")
