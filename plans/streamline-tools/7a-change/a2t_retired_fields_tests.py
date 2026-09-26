"""Release 7A (4.2.293), step 2's tests: the test designs, requests and fixture
lose the retired keys; the test that held the test-question starter's answer
rule is replaced by tests proving the slot and the three Lesson 2 keys are now
refused as unknown fields, by the validator and by the scaffold; the CLI
wrong-type test, which used `lesson.scope` only as a field to give the wrong
type, uses `lesson.stickingPoint` instead so it keeps its point."""
from _patch import assert_absent, replace_once

CONTRACT = "scripts/tests/test_lesson_design_contract.py"
SCAFFOLD_TEST = "scripts/tests/test_lesson_design_scaffold.py"
RHYTHM = "scripts/tests/test_rhythm_holds_in_every_route.py"
TWO_OUR_TURNS = "scripts/tests/test_two_our_turns_message.py"
PACKET_TEST = "scripts/tests/test_design_review_packet.py"
FIXTURE = "scripts/tests/fixtures/working-wall-packet/geography/lesson-design.json"

replace_once(CONTRACT, '''            "durationMinutes": 45,
            "scope": "Complete lesson",
            "deferredLearning": None,
            "lesson2Direction": None,
            "stickingPoint": "Keep tens with tens and ones with ones.",''', '''            "durationMinutes": 45,
            "stickingPoint": "Keep tens with tens and ones with ones.",''')
replace_once(CONTRACT, '''                "format": "Four short calculations.",
                "testQuestionPath": None,
            },''', '''                "format": "Four short calculations.",
            },''')
replace_once(CONTRACT, '''def test_bank_starter_requires_exact_answer_slide_answer():
    design, photos = valid_contract()
    starter = design["starter"]
    starter["content"]["testQuestionPath"] = "/bank/question.png"
    starter["answer"] = no_answer()
    assert_invalid_contract(
        design,
        photos,
        "must be an exact answer-slide answer when starter.testQuestionPath is present",
    )
''', '''def test_the_test_question_starter_slot_is_gone():
    # The teacher removed the test-question starter as if it had never existed
    # (24 September 2026, release 7A), so its old always-empty slot is refused
    # like any field the contract does not have, empty or filled.
    for value in (None, "/bank/question.png"):
        design, photos = valid_contract()
        design["starter"]["content"]["testQuestionPath"] = value
        assert_invalid_contract(design, photos, "has unknown fields: testQuestionPath")


def test_the_lesson_2_plan_is_gone_from_the_lesson_file():
    # The Lesson 2 plan came out (PF decision 20, release 7A): a lesson that
    # left something for another lesson says what in one line of the
    # walk-through's closing decisions, and the file plans nothing further.
    for key, value in (
        ("scope", "Complete lesson"),
        ("scope", "Lesson 1 of 2"),
        ("deferredLearning", None),
        ("lesson2Direction", "Write the diary entry."),
    ):
        design, photos = valid_contract()
        design["lesson"][key] = value
        assert_invalid_contract(design, photos, f"lesson has unknown fields: {key}")
''')
replace_once(CONTRACT, '''    design["lesson"]["scope"] = []''', '''    design["lesson"]["stickingPoint"] = []''')

replace_once(SCAFFOLD_TEST, '''        "subject": "Science",
        "scope": "Complete lesson",
        "vocabularyCount": 2,''', '''        "subject": "Science",
        "vocabularyCount": 2,''')
replace_once(SCAFFOLD_TEST, '''def test_cli_writes_parseable_scaffolds_and_exact_success_marker():''', '''def test_a_request_carrying_a_lesson_2_plan_is_refused():
    # Release 7A: `scope` left the request with the lesson file's Lesson 2
    # plan, and the scaffold no longer writes `testQuestionPath` or any of the
    # three lesson keys.
    request = base_request()
    request["scope"] = "Complete lesson"
    try:
        scaffold.validate_request(request)
    except scaffold.ScaffoldError as exc:
        assert "scaffold request has unknown fields: scope" in str(exc)
    else:
        raise AssertionError("a request carrying scope unexpectedly validated")
    assert scaffold.CONTENT_ENVELOPE_FIELDS["starter"] == ("activity", "connection", "format")


def test_cli_writes_parseable_scaffolds_and_exact_success_marker():''')

# The first check found the guide's example request untested: putting `scope`
# back would make every run's first scaffold call fail.
replace_once(SCAFFOLD_TEST, '''def test_cli_writes_parseable_scaffolds_and_exact_success_marker():''', '''def test_the_guide_example_request_is_one_the_scaffold_accepts():
    # Release 7A: the guide's example is what the designer copies, so it
    # carries exactly the fields the scaffold takes, and no `scope`.
    guide = (ROOT / "references" / "lesson-design-scaffold.md").read_text(encoding="utf-8")
    block = guide.split("## Scaffold request", 1)[1].split("```json", 1)[1].split("```", 1)[0]
    example = json.loads(block)
    assert "scope" not in example
    assert set(example) == scaffold.REQUEST_FIELDS
    scaffold.validate_request(example)


def test_cli_writes_parseable_scaffolds_and_exact_success_marker():''')

replace_once(RHYTHM, '''            "subject": "PSHE",
            "scope": "Complete lesson",
''', '''            "subject": "PSHE",
''')
replace_once(TWO_OUR_TURNS, '''    "scope": "Complete lesson", "vocabularyCount": 1, "vocabularyIntroductionCount": 1,''',
             '''    "vocabularyCount": 1, "vocabularyIntroductionCount": 1,''')
replace_once(PACKET_TEST, '''            "format": "DESIGNER ONLY format",
            "testQuestionPath": None,
        },''', '''            "format": "DESIGNER ONLY format",
        },''')
replace_once(FIXTURE, '''    "durationMinutes": 45,
    "scope": "Complete lesson",
    "deferredLearning": null,
    "lesson2Direction": null,
    "stickingPoint":''', '''    "durationMinutes": 45,
    "stickingPoint":''')
replace_once(FIXTURE, '''      "format": "Three short map questions.",
      "testQuestionPath": null
    },''', '''      "format": "Three short map questions."
    },''')

for rel in (RHYTHM, TWO_OUR_TURNS, PACKET_TEST, FIXTURE):
    for phrase in ("testQuestionPath", "lesson2Direction", "deferredLearning", '"scope": "Complete lesson"'):
        assert_absent(rel, phrase)
print("tests follow the retired fields")
