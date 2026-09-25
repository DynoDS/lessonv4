"""The worksheets release (4.2.290), step 9: the tests this release moves and
adds, each saying which decision moved it (change plan section 5, item 9).

Moved (Python):
- test_unavailable_picture_route.py: the builder's row now re-points (settled f).
- test_the_form_of_the_answer_is_chosen.py: the dated count left the runtime
  for the log (stories); the reason and the teeth example stay held where they
  are.
- test_lesson_designer_component_loading.py: the two-page condition is the
  printed page's (settled h, O18), so it is held there, and the component's
  pointer is held beside it.
- test_success_criteria_fit_a_glance.py: the list refusal gained decision 10's
  sentence, and the whole message is still held.

Moved and added (engine):
- slips.test.js: page-only words are a prompt to look again (settled o).
- directed-sheets.test.js: a teaching gap stands (decision 5); terminal
  receipts and an unavailable picture stage let a picture gap stand (settled f);
  a picture excuse with no ref, a published receipt and no receipt still
  refuse; the preflight prints the books prompt and passes.
- list-refusal-message.test.js (new): decision 10 in the list refusal, with
  neither of the success-criteria topic's barred wordings.
- page-furniture.test.js: a comment that said a method's steps stay on the
  board (the plan's decision 10 must not say where they are shown).

The pins:
- ledger_pin_checks.py takes the folders a topic's rows may name (default
  unchanged), because thirteen of this topic's rows live in `worksheet-html/`.
- test_worksheets_ledger_is_kept.py is placed from `ws-change/new/`; its pin
  file is written by `build_ws_mapping.py`, which runs after `w9`.
"""
from pathlib import Path

from _patch import ROOT, replace_once

HERE = Path(__file__).resolve().parent

# ─── Python ───────────────────────────────────────────────────────────────
replace_once(
    "scripts/tests/test_unavailable_picture_route.py",
    "        self.assertIn(\"the worksheet-designer re-authors that one reference\", text)\n",
    "        # Settled item f of the worksheets topic (4.2.290), his 2 September\n"
    "        # review: re-point a dead reference at a published picture, never\n"
    "        # replace it with words; if none can carry it, the sheet goes back to\n"
    "        # its author, and a Below or Greater Depth sheet costs no other sheet.\n"
    "        self.assertIn(\n"
    "            \"the worksheet-designer re-points that one reference at a published \"\n"
    "            \"picture, or returns that sheet to its author (a Below or Greater Depth \"\n"
    "            \"sheet to the adaptation designer, and the build makes the others; the \"\n"
    "            \"Expected sheet to the lesson designer)\",\n"
    "            text,\n"
    "        )\n"
    "        self.assertNotIn(\"re-authors that one reference\", text)\n",
)
replace_once(
    "scripts/tests/test_unavailable_picture_route.py",
    "    def test_the_worksheet_exception_still_protects_the_learning(self):\n"
    "        text = flat(WORKSHEET_REPAIR)\n"
    "        self.assertIn(\"Keep the learning that reference was serving\", text)\n"
    "        self.assertIn(\"change nothing else\", text)\n",
    "    def test_the_worksheet_exception_still_protects_the_learning(self):\n"
    "        text = flat(WORKSHEET_REPAIR)\n"
    "        self.assertIn(\"Keep the learning that reference was serving\", text)\n"
    "        self.assertIn(\"change nothing else\", text)\n"
    "        # Settled item f (4.2.290): only a published picture, never words;\n"
    "        # otherwise it is left for the lesson designer.\n"
    "        self.assertIn(\"Re-point that single reference at a picture this run has already published.\", text)\n"
    "        self.assertIn(\"leave it unrepaired and return `WORKSHEET_CONTENT_GAP` for it\", text)\n"
    "        # The first check's repair round: a Below or Greater Depth sheet goes\n"
    "        # back to the adaptation designer and never costs the other sheets;\n"
    "        # his answer of 25 September: the Expected sheet stands in meanwhile;\n"
    "        # the second check: the sheet is taken out whole, not left in place.\n"
    "        self.assertIn(\"On a Below or Greater Depth sheet, take that sheet and its answer-key section out whole, and add its `returned` entry\", text)\n"
    "        self.assertIn(\"until the redesign goes in, the build prints the Expected sheet in its place and flags it\", text)\n"
    "        self.assertNotIn(\"carries its own demand in words\", text)\n",
)

replace_once(
    "scripts/tests/test_the_form_of_the_answer_is_chosen.py",
    "    def test_the_designer_is_shown_the_count_that_caused_it(self):\n"
    "        components = flat(COMPONENTS)\n"
    "        self.assertIn(\"Eleven sheets built between 5 and 12 September 2026\", components)\n"
    "        self.assertIn(\"name the layers of teeth\", components)\n",
    "    def test_the_designer_is_shown_the_count_that_caused_it(self):\n"
    "        # The worksheets topic (4.2.290) moved the dated count to the build\n"
    "        # log (stories leave, reasons stay): the designer keeps the reason and\n"
    "        # the teeth sheet as a plain example, and the log keeps the count.\n"
    "        components = flat(COMPONENTS)\n"
    "        self.assertIn(\"This exists because the choice was being made by default and nobody could see it.\", components)\n"
    "        self.assertIn(\"While `response` was free text\", components)\n"
    "        self.assertIn(\"name the layers of teeth\", components)\n"
    "        self.assertNotIn(\"Eleven sheets built between\", components)\n"
    "        log = flat(COMPONENTS.parent / \"build-review-log.md\")\n"
    "        self.assertIn(\"Eleven worksheet specs built between 5 and 12 September were read by what they actually draw.\", log)\n",
)

replace_once(
    "scripts/tests/test_lesson_designer_component_loading.py",
    "            \"a paragraph in a writing lesson\", \"the sheet carries photographs\",\n"
    "            \"Two pages only when the central task needs a substantial write-on visual\",\n"
    "        ):\n"
    "            self.assertIn(needed, view)\n",
    "            \"a paragraph in a writing lesson\", \"the sheet carries photographs\",\n"
    "            # Settled item h of the worksheets topic (4.2.290): the component\n"
    "            # points at the printed page for the two-page condition and keeps\n"
    "            # its one extra and the limit; the condition is held at its home.\n"
    "            \"the two-page exception and its limits are `preferences.md` → The printed page's\",\n"
    "            \"state the eligibility and protect the visual\",\n"
    "            \"A second page is never for overflow, prose or extra questions\",\n"
    "        ):\n"
    "            self.assertIn(needed, view)\n"
    "        preferences = \" \".join((ROOT / \"references\" / \"preferences.md\").read_text(encoding=\"utf-8\").split())\n"
    "        self.assertIn(\n"
    "            \"A per-child sheet may use exactly two printable pages only when the central learning task \"\n"
    "            \"requires a substantial write-on visual\",\n"
    "            preferences,\n"
    "        )\n",
)

replace_once(
    "scripts/tests/test_success_criteria_fit_a_glance.py",
    "    # Decision 8 is success criteria only; a method's steps a child works\n"
    "    # through go with their question. A clause on any line of the message\n"
    "    # would change that, so the whole message is held.\n",
    "    # Decision 8 is success criteria only; a method's steps a child works\n"
    "    # through go with their question. A clause on any line of the message\n"
    "    # would change that, so the whole message is held. The worksheets\n"
    "    # topic's decision 10 (4.2.290) added one sentence: a list of a method's\n"
    "    # steps printed just as a reminder is left off too, without saying where\n"
    "    # the steps are shown.\n",
)
replace_once(
    "scripts/tests/test_success_criteria_fit_a_glance.py",
    "        'board and are never printed on a worksheet. Otherwise, if they are steps a child ' +\n",
    "        'board and are never printed on a worksheet. A list of a method\\\\'s steps printed ' +\n"
    "        'just as a reminder is left off too. Otherwise, if they are steps a child ' +\n",
)

# ─── engine: slips ───────────────────────────────────────────────────────
replace_once(
    "worksheet-html/test/slips.test.js",
    "const {\n"
    "  recordingProblems,\n",
    "const {\n"
    "  recordingProblems,\n"
    "  recordingAdvisories,\n",
)
replace_once(
    "worksheet-html/test/slips.test.js",
    "test(\"a books sheet whose words need the printed page is caught\", () => {\n"
    "  for (const text of [\n"
    "    \"Circle the number that rounds to 3,000.\",\n"
    "    \"Mark 2,748 on the number line.\",\n"
    "    \"Write the missing numbers in the boxes.\",\n"
    "    \"Label the parts of the plant.\",\n"
    "    \"Fill in the table.\",\n"
    "  ]) {\n"
    "    const worksheet = { sheets: { expected: sheet(\"books\", text) } };\n"
    "    assert.deepEqual(signals(worksheet), [\"expected:RECORDING_NEEDS_SHEET\"], text);\n"
    "  }\n"
    "});\n",
    (HERE / "new" / "slips-looks-again.test.snippet.js").read_text(encoding="utf-8"),
)
replace_once(
    "worksheet-html/test/slips.test.js",
    "  assert.match(stdout, /^RECORDING_CHANGED: Expected - /m);\n"
    "  assert.doesNotMatch(stdout, /^SLIPS: /m);\n"
    "});\n",
    "  assert.match(stdout, /^RECORDING_CHANGED: Expected - /m);\n"
    "  // Settled item o (4.2.290): corrected only because nobody answered it.\n"
    "  assert.match(stdout, /the sheet does not say it was looked at again/);\n"
    "  assert.doesNotMatch(stdout, /^SLIPS: /m);\n"
    "});\n"
    + (HERE / "new" / "slips-build.test.snippet.js").read_text(encoding="utf-8"),
)

# ─── engine: the directed-sheet gate ─────────────────────────────────────
# Two 4.2.289 tests read a picture excuse out of a note; the gate now reads
# the `returned` record (decision 5, the first check's finding 1), so each
# carries one and asserts what it always asserted.
replace_once(
    "worksheet-html/test/directed-sheets.test.js",
    "      \"published pictures; return to adaptation designer.\",\n"
    "  ];\n",
    "      \"published pictures; return to adaptation designer.\",\n"
    "  ];\n"
    "  spec.returned = [\n"
    "    { sheet: \"below\", problem: \"picture\", refs: [\"adaptation-photo-001\", \"adaptation-photo-002\"] },\n"
    "  ];\n",
)
replace_once(
    "worksheet-html/test/directed-sheets.test.js",
    "      \"adaptation-photo-009 has no approved request; return to adaptation designer.\",\n"
    "  ];\n",
    "      \"adaptation-photo-009 has no approved request; return to adaptation designer.\",\n"
    "  ];\n"
    "  spec.returned = [{ sheet: \"below\", problem: \"picture\", refs: [\"adaptation-photo-009\"] }];\n",
)
path = ROOT / "worksheet-html" / "test" / "directed-sheets.test.js"
text = path.read_text(encoding="utf-8")
assert "what can stand, 4.2.290" not in text
path.write_text(text.rstrip("\n") + "\n" + (HERE / "new" / "directed-sheets.test.snippet.js").read_text(encoding="utf-8"), encoding="utf-8")

# ─── engine: the list refusal's words, and the generated references ──────
for name in ("list-refusal-message.test.js", "generated-references.test.js"):
    (ROOT / "worksheet-html" / "test" / name).write_bytes((HERE / "new" / name).read_bytes())

# ─── the pin checks read this topic's engine rows, and its test is placed ─
# Thirteen of the ledger's rows live in `worksheet-html/`; the shared check
# takes the folders a topic's rows may name, and every earlier topic keeps its
# list (none of their ledgers has a row that lives only in an engine folder).
replace_once(
    "scripts/tests/ledger_pin_checks.py",
    "def make_ledger_tests(pins_path: Path, ledger_path: Path, prefix: str, expected_rows: int):\n"
    "    ledger_row = re.compile(\n"
    "        rf\"^\\| ({prefix}-[A-Z]\\d{{2}}) \\|.*`(?:agents|references|skills|commands|scripts|builder)/\",\n"
    "        re.MULTILINE,\n"
    "    )\n",
    "LEDGER_FOLDERS = (\"agents\", \"references\", \"skills\", \"commands\", \"scripts\", \"builder\")\n"
    "\n"
    "\n"
    "def make_ledger_tests(pins_path: Path, ledger_path: Path, prefix: str, expected_rows: int,\n"
    "                      folders: tuple[str, ...] = LEDGER_FOLDERS):\n"
    "    # `folders` are the plugin folders a row's Where column may name. The\n"
    "    # worksheets topic lists rows that live in the sheet engine\n"
    "    # (`worksheet-html/`), so its test passes that folder too; every earlier\n"
    "    # topic keeps the list its pins were built with.\n"
    "    ledger_row = re.compile(\n"
    "        rf\"^\\| ({prefix}-[A-Z]\\d{{2}}) \\|.*`(?:{'|'.join(folders)})/\",\n"
    "        re.MULTILINE,\n"
    "    )\n",
)
(ROOT / "scripts" / "tests" / "test_worksheets_ledger_is_kept.py").write_bytes(
    (HERE / "new" / "test_worksheets_ledger_is_kept.py").read_bytes()
)

replace_once(
    "worksheet-html/test/page-furniture.test.js",
    "  // Criteria and a method's steps stay on the board (4.2.288), so the\n"
    "  // refusal no longer sends them to the steps panel.\n",
    "  // Criteria stay on the board (4.2.288), and a list of a method's steps\n"
    "  // printed just as a reminder is left off too (4.2.290), so the refusal no\n"
    "  // longer sends either to the steps panel.\n",
)
# ─── the repair's scope check: the record of a return is not child content
SCOPE_TESTS = '''

class ASheetSentBackTests(RepairScopeCase):
    \"\"\"The worksheets topic (4.2.290): a Below or Greater Depth picture that
    will never arrive sends that sheet back to the adaptation designer, and it
    must never cost the other sheets or the answer key. The focused repair
    takes the sheet out whole, with its answer-key section, and records the
    return; the build prints the Expected sheet in its place until the
    redesign goes in. The record is not something a child reads.\"\"\"

    BEFORE = {
        \"sheets\": {
            \"below\": {\"zones\": [{\"stack\": [{\"helper\": \"card-row\", \"cards\": [{\"imagePath\": \"never.png\"}]}, {\"helper\": \"questions\", \"question\": True, \"items\": [\"What does the photograph show?\"]}]}]},
            \"expected\": {\"zones\": [{\"stack\": [{\"helper\": \"written-answers\", \"question\": True, \"items\": [{\"text\": \"Explain why.\", \"lines\": 3}]}]}]},
        },
        \"answerKey\": {\"below\": [{\"question\": 1, \"answer\": \"A fan.\"}], \"expected\": [{\"question\": 1, \"answer\": \"Because.\"}]},
    }
    RECORD = [{\"sheet\": \"below\", \"problem\": \"picture\", \"refs\": [\"adaptation-photo-002\"]}]
    NOTE = [\"WORKSHEET_CONTENT_GAP: Below - adaptation-photo-002 will never arrive; return to adaptation designer.\"]

    def sent_back(self):
        after = json.loads(json.dumps(self.BEFORE))
        del after[\"sheets\"][\"below\"]
        del after[\"answerKey\"][\"below\"]
        after[\"returned\"] = self.RECORD
        after[\"notes\"] = self.NOTE
        return after

    def test_sending_a_sheet_back_whole_and_recording_it_is_a_repair(self):
        result = self.run_check(self.BEFORE, self.sent_back())
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn(\"REPAIR_SCOPE_OK\", result.stdout)

    def test_taking_a_sheet_out_without_recording_it_is_still_caught(self):
        after = json.loads(json.dumps(self.BEFORE))
        del after[\"sheets\"][\"below\"]
        del after[\"answerKey\"][\"below\"]
        result = self.run_check(self.BEFORE, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn(\"REPAIR_SCOPE_FAILED\", result.stdout)

    def test_a_record_does_not_release_a_sheet_still_in_the_spec(self):
        after = json.loads(json.dumps(self.BEFORE))
        after[\"sheets\"][\"below\"][\"zones\"][0][\"stack\"][1][\"items\"] = []
        after[\"returned\"] = self.RECORD
        result = self.run_check(self.BEFORE, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn(\"REPAIR_SCOPE_FAILED\", result.stdout)

    def test_a_record_already_there_cannot_be_taken_away(self):
        before = self.sent_back()
        after = json.loads(json.dumps(before))
        del after[\"returned\"]
        result = self.run_check(before, after)
        self.assertEqual(result.returncode, 1, result.stdout)
        self.assertIn(\"record(s) of a sheet sent back\", result.stdout)
'''
scope = ROOT / "scripts" / "tests" / "test_repair_scope.py"
scope_text = scope.read_text(encoding="utf-8")
assert "class ASheetSentBackTests" not in scope_text
marker = "\n\nif __name__ == \"__main__\":"
if marker in scope_text:
    scope_text = scope_text.replace(marker, SCOPE_TESTS.rstrip("\n") + "\n" + marker, 1)
else:
    scope_text = scope_text.rstrip("\n") + "\n" + SCOPE_TESTS
scope.write_text(scope_text, encoding="utf-8")

# ─── the pin checks: a retired phrase in any case; a home at the file's end
# The first check brought a retired sentence back with a capital first letter
# and every test passed. A barred phrase marked `anyCase` (this topic's
# builder marks every phrase that is gone in any case) is matched ignoring
# case; earlier topics' pins carry no mark and are matched as before.
replace_once(
    "scripts/tests/ledger_pin_checks.py",
    "                    for path in files:\n"
    "                        with self.subTest(row=row[\"id\"], file=str(path.relative_to(ROOT))):\n"
    "                            self.assertNotIn(pin[\"text\"], flat(path.read_text(encoding=\"utf-8\")))\n",
    "                    for path in files:\n"
    "                        with self.subTest(row=row[\"id\"], file=str(path.relative_to(ROOT))):\n"
    "                            body = flat(path.read_text(encoding=\"utf-8\"))\n"
    "                            if pin.get(\"anyCase\"):\n"
    "                                self.assertNotIn(pin[\"text\"].lower(), body.lower())\n"
    "                            else:\n"
    "                                self.assertNotIn(pin[\"text\"], body)\n",
)
# A home that is the last section of its file ends at the file's end, so a
# section moved there is compared, not crashed on (the first check's attack 19).
replace_once(
    "scripts/tests/ledger_pin_checks.py",
    "                end = next(i for i in range(start + 1, len(lines))\n"
    "                           if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level)\n",
    "                end = next((i for i in range(start + 1, len(lines))\n"
    "                            if HEADING.match(lines[i]) and len(HEADING.match(lines[i]).group(1)) <= level),\n"
    "                           len(lines))\n",
)
print("tests moved and added")
