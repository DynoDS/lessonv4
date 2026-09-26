"""The design reviewer release: each change undone, one at a time, on a scratch
copy, must make a test fail ("undo each repair yourself and see a test fail").

    python -X utf8 rv_13_undo_checks.py

Copies this copy's plugin (without `node_modules`) and `plans/` into
`plans/streamline-tools/scratch/rv/undo/`, runs the tests there untouched first
(they must pass), then for each undo writes one file, runs the tests that should
catch it, records caught or missed, and puts the file back byte for byte. The
real tree is never written. Output: `scratch/rv/undo/undo-run.txt`."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SCRATCH = REPO / "plans" / "streamline-tools" / "scratch" / "rv" / "undo"
COPY = SCRATCH / "copy"
PLUGIN = COPY / "plugins" / "lesson-v4"
print(f"copying {REPO} into {COPY}")
if COPY.exists():
    shutil.rmtree(COPY)
shutil.copytree(REPO / "plugins" / "lesson-v4", PLUGIN,
                ignore=shutil.ignore_patterns("node_modules", "__pycache__", ".pytest_cache"))
shutil.copytree(REPO / "plans", COPY / "plans", ignore=shutil.ignore_patterns("scratch", "*.log"))

REV = "agents/design-reviewer.md"
PACKET = "scripts/design-review-packet.py"
FIXTURE = "scripts/tests/fixtures/design-reviewer-behaviour-cases.json"
LOG = "references/build-review-log.md"
TESTS = ["scripts/tests/test_design_reviewer_ledger_is_kept.py", "scripts/tests/test_design_review_packet.py",
         "scripts/tests/test_reviewer_voice_authority.py", "scripts/tests/test_a_maths_sheet_continues_the_lesson.py"]
OTHER_PINS = ["scripts/tests/test_worksheets_ledger_is_kept.py", "scripts/tests/test_quick_checks_ledger_is_kept.py",
              "scripts/tests/test_teach_then_do_ledger_is_kept.py", "scripts/tests/test_assumed_knowledge_ledger_is_kept.py",
              "scripts/tests/test_success_criteria_ledger_is_kept.py"]

UNDO = [
    ("his C10 answer: the Teach example sent to the designer again", REV,
     "Repair it to what they will notice, or, when the picture's own label already names the thing, take the line off the board and let the key question do the pointing",
     "Return it to the Lesson Designer, naming the fix: the line rewritten as what they will notice, or, when the picture's own label already names the thing, the line taken off the board and the key question doing the pointing"),
    ("his C10 answer: the fixture's case given to the designer again", FIXTURE,
     "\"expectedResult\": \"APPROVED AFTER BOUNDED CORRECTION\",\n      \"expectedOwner\": \"Design Reviewer\",\n      \"protectedBehaviour\": \"An example written as an instruction to look",
     "\"expectedResult\": \"REDESIGN REQUIRED\",\n      \"expectedOwner\": \"Lesson Designer\",\n      \"protectedBehaviour\": \"An example written as an instruction to look"),
    ("decision 2: the restating Do back as a local repair", REV,
     "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think: return it naming the fix, which asks for the because,",
     "The repair is local and keeps the chunk: ask for the because,"),
    ("decision 2: the drawn tool back as the reviewer's correction", REV,
     "Return it to the Lesson Designer, naming the helper that should draw it.",
     "Raise it as a correction naming the helper that should draw it."),
    ("decision 2: a permission slipped in beside the drawn-tool check", REV,
     "Return it to the Lesson Designer, naming the helper that should draw it.",
     "Return it to the Lesson Designer, naming the helper that should draw it, or swap the photograph yourself when the helper is obvious."),
    ("settled 4: board and notes judged together again", REV,
     "Judge the visible explanation first, on its own, and the spoken one separately, so nothing counts as taught on the board because the script says it;",
     "Judge the spoken and visible explanation together;"),
    ("settled 5: the old failed-check reason", REV,
     "A failed check sends your corrections to a focused repair and, only if that fails, the whole design to a fresh attempt, which delays every resource in the lesson so that one sentence can be shortened; shortening",
     "The orchestrator can only answer a failed check by sending the whole design back for repair, which delays every resource in the lesson so that one sentence can be shortened, and shortening"),
    ("settled 5: the closest calls out of the report shape", REV,
     "Closest to a repair:\n> \"the exact string\" - why it stands\n> \"the exact string\" - why it stands\n> \"the exact string\" - why it stands\n",
     ""),
    ("settled 5: \"now\" back", REV, "The design states this in each unit's", "The design now states this in each unit's"),
    ("settled 10: the validator line back", REV,
     "\n\nCompare the finished design with the walk-through",
     "\n\nDo not recheck identifier or reference legality.\n\nCompare the finished design with the walk-through"),
    ("settled 10: the reading-order line back", REV,
     "\n\nCompare the finished design with the walk-through",
     "\n\nThen read the closing decisions of `design-decisions.md`, the part you left until now.\n\nCompare the finished design with the walk-through"),
    ("settled 10: the amount bullet back", REV,
     "- support remains where it enables the intended thinking",
     "- each moment carries only what the class can take in at once (the User-fit judgement above owns that test; do not run it twice);\n- support remains where it enables the intended thinking"),
    ("settled 10: the sweep clause back", REV,
     "Here judge the wording you noted in its teaching context.",
     "Here judge the wording you noted in its teaching context; do not repeat a separate whole-lesson sweep."),
    ("settled 10: REDESIGN REQUIRED said twice", REV,
     "Do not restate the lesson, the review process or rules.",
     "Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change.\n\nDo not restate the lesson, the review process or rules."),
    ("settled 11: the history story back", REV,
     "whether a return adds something.\n",
     "whether a return adds something. The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026 with `both comparison objects available and live model space retained`, and was abandoned in the room, because one plate came back on nine of eighteen slides and the practice beat carried all four sources, a two-part task, three bullets and an evidence question at once.\n"),
    ("settled 11: the RE deck story back", REV,
     "(`preferences.md` → Lesson Designer visual-need boundary). A real person",
     "(`preferences.md` → Lesson Designer visual-need boundary). A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own carol-singing photograph unused. A real person"),
    ("settled 11: the count-line reason dropped", REV,
     " A count line alone is what a sweep that happened and a sweep that did not both produce.", ""),
    ("settled 11: the two script lines dropped", REV,
     " A script line such as `He wasn't a king who could order everybody to obey him` or `People sometimes call the whole front of their body their tummy, but the stomach is this one organ`, with no counterpart on the board, is that finding.", ""),
    ("settled 11: the teeth example dropped", REV,
     ", as in a *name the layers of teeth* sheet that asked for three names on three ruled lines under an unused diagram.", "."),
    ("settled 11: the log loses a story", LOG,
     "A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own carol-singing photograph unused.", "A Year 4 RE deck passed."),
    ("the reader: a Year 4 age back", REV, "the actual child in this class, who has not read the plan",
     "the actual eight- or nine-year-old the year group names, who has not read the plan"),
    ("decision 7: the name case off the card", PACKET,
     "        \"instructions only.\"\n"
     "        \" Read its `Lesson Designer content boundaries` too whenever the \"\n"
     "        \"view's `Names on the board` lists a real person, place, \"\n"
     "        \"organisation or event, for `A name, or a thing the class has \"\n"
     "        \"never met, arrives with its context`; a made-up person or a label \"\n"
     "        \"such as `Chart A` is not this case.\",\n",
     "        \"instructions only.\",\n"),
    ("the first check's item 1: the name case back to any listed name", PACKET,
     "lists a real person, place, \"\n"
     "        \"organisation or event, for",
     "lists a name, for \"\n"
     "        \"the case, for"),
    ("the first check's item 1: the name case's limit dropped", PACKET,
     "arrives with its context`; a made-up person or a label \"\n"
     "        \"such as `Chart A` is not this case.\",",
     "arrives with its context`.\","),
    ("decision 7: the invented person off the card", PACKET,
     " Read it too whenever a beat quotes, voices or names a made-up \"\n"
     "        \"person who is present in it, for `A person the lesson invents \"\n"
     "        \"counts as something in the world`; one only referred back to is \"\n"
     "        \"not this case.\",",
     "\","),
    ("decision 7: the invented person's limit dropped", PACKET,
     "counts as something in the world`; one only referred back to is \"\n"
     "        \"not this case.\",",
     "counts as something in the world`.\","),
    ("decision 7: the group case off the card", PACKET,
     " Read it too when a made-up person or story stands for a group \"\n"
     "        \"the objective is about (`An invented case is evidence about the \"\n"
     "        \"group`).\",",
     "\","),
    ("decision 7: the name trigger turned into the defect itself", PACKET,
     "whenever the \"\n"
     "        \"view's `Names on the board` lists a real person, place, \"\n"
     "        \"organisation or event,",
     "whenever a \"\n"
     "        \"name's first appearance has no words telling the class who it is,"),
    ("decision 7: the name case naming a paragraph its section does not hold", PACKET,
     "for `A name, or a thing the class has \"\n"
     "        \"never met, arrives with its context`;",
     "for `A name is taught on its card \"\n"
     "        \"before it is used`;"),
    ("the reader: the lead's wording claimed as his", LOG,
     "This is the lead's reading of his words, not his wording:",
     "In his words:"),
    ("the second check: the log's C10 sentence turned", LOG,
     "stays the reviewer's own wording fix, word for word as it was",
     "goes to the Lesson Designer too, word for word as it was"),
    ("the second check: the log's floor thinned", LOG,
     "to carry the unresolved finding into the run report's blocking faults and his teacher flags,",
     "to note the unresolved finding,"),
    ("the second check: the log's floor claimed as a program's", LOG,
     "That last part is held by the playbook's words, not by a program:",
     "A program holds that last part:"),
    ("the second check: the log's count changed", LOG,
     "it fires on 19 of the 53", "it fires on none of the 53"),
    ("the second check: the script no longer vouches for a name", PACKET,
     "    for spoken in spoken_reading(design):\n        for name in board_names_in(spoken):",
     "    for spoken in []:\n        for name in board_names_in(spoken):"),
    ("the second check: a name only the script says listed", PACKET,
     "        found += [name for text in board for name in board_names_in(text, known)]",
     "        found += [name for text in board + spoken_reading(design) for name in board_names_in(text, known)]"),
    ("decision 2: a fixture case given back to the reviewer", FIXTURE,
     "\"id\": \"photograph-of-a-drawn-tool-goes-back-named\",\n      \"materialDifference\": \"A Year 4 rounding lesson asks for a photograph of a number line from 300 to 400 on its Teach slide, a tool the engine draws.\",\n      \"expectedResult\": \"REDESIGN REQUIRED\",\n      \"expectedOwner\": \"Lesson Designer\",",
     "\"id\": \"photograph-of-a-drawn-tool-goes-back-named\",\n      \"materialDifference\": \"A Year 4 rounding lesson asks for a photograph of a number line from 300 to 400 on its Teach slide, a tool the engine draws.\",\n      \"expectedResult\": \"APPROVED AFTER BOUNDED CORRECTION\",\n      \"expectedOwner\": \"Design Reviewer\","),
    ("the worksheet section's story back (the worksheets home)", REV,
     "do not judge or ask for them here. Read the forms rather",
     "do not judge or ask for them here. This is the check that was too thin to catch a place-value-chart lesson whose sheet had no chart on it, so read the forms rather"),
]

env = dict(os.environ)


def run(tests):
    proc = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", *tests, "-q", "-x", "-p", "no:cacheprovider"],
                          cwd=PLUGIN, capture_output=True, text=True, encoding="utf-8", env=env)
    return proc.returncode, (proc.stdout + proc.stderr).strip().splitlines()[-1:]


code, tail = run(TESTS + OTHER_PINS)
out = [f"untouched copy: {'passes' if code == 0 else 'FAILS'} {tail}"]
print(out[-1])
assert code == 0, "the untouched copy must pass first"

caught = 0
for label, rel, now, then in UNDO:
    path = PLUGIN / rel
    original = path.read_bytes()
    text = original.decode("utf-8")
    assert text.count(now) == 1, (label, text.count(now))
    path.write_bytes(text.replace(now, then).encode("utf-8"))
    tests = TESTS + (OTHER_PINS if rel == REV and "worksheet" in label else [])
    code, tail = run(tests)
    path.write_bytes(original)
    ok = code != 0
    caught += ok
    out.append(f"{'caught' if ok else 'MISSED'}: {label} {tail}")
    print(out[-1])
out.append(f"{caught} of {len(UNDO)} caught")
print(out[-1])
(SCRATCH / "undo-run.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
