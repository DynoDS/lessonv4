"""The routes release: each change undone, one at a time, on a complete scratch
copy of the plugin, and the tests run, to see that a test catches it.

The copy is this branch's plugin (without its node libraries, which no attack
here needs) with the ledgers beside it in `plans/`, so the ledger pin tests run
rather than skip. The untouched copy is tested first and must pass. Each attack
replaces one text, runs the tests that read it, and puts the file back byte for
byte; the copy is compared with the branch at the end. Nothing in the branch is
written.

    python -X utf8 rt_undo_checks.py

Writes `scratch/rt/undo/undo.txt`."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "undo"
COPY = OUT / "plugins" / "lesson-v4"
print(f"writing the scratch copy into {OUT}")
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(REPO / "plugins" / "lesson-v4", COPY,
                ignore=shutil.ignore_patterns("node_modules", "__pycache__", ".pytest_cache", "educational-svg"))
(OUT / "plans").mkdir()
for ledger in (REPO / "plans").glob("2026-*-ledger.md"):
    shutil.copyfile(ledger, OUT / "plans" / ledger.name)

TESTS = [
    "scripts/tests/test_routes_ledger_is_kept.py",
    "scripts/tests/test_a_good_explanation_is_seen_first_in_every_route.py",
    "scripts/tests/test_the_class_view_reads_every_explanation_the_board_shows.py",
    "scripts/tests/test_the_leisure_lesson_repairs.py",
    "scripts/tests/test_do_beats_look_like_the_subject.py",
    "scripts/tests/test_the_board_carries_the_route.py",
    "scripts/tests/test_the_board_teaches_and_the_criteria_are_runnable.py",
    "scripts/tests/test_lesson_design_contract.py",
    "scripts/tests/test_teach_then_do_ledger_is_kept.py",
    "scripts/tests/test_quick_checks_ledger_is_kept.py",
    "scripts/tests/test_success_criteria_ledger_is_kept.py",
    "scripts/tests/test_subject_files_ledger_is_kept.py",
]


def run_tests() -> tuple[bool, str]:
    done = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", *TESTS, "-q", "-x", "-p", "no:cacheprovider"],
                          cwd=COPY, capture_output=True, text=True, encoding="utf-8", env=dict(os.environ))
    tail = (done.stdout + done.stderr).strip().splitlines()
    return done.returncode == 0, tail[-1] if tail else ""


CONTENT = "references/teaching-sequence-content-based.md"
SKILL = "references/teaching-sequence-skill-based.md"
TASK = "references/teaching-sequence-task-centred.md"
DIAL = "references/teaching-sequence-dialogic.md"
DISC = "references/teaching-sequence-discovery.md"
DB = "references/do-beats.md"
ES = "references/evidence-synthesis.md"
ET = "references/explanation-tasks.md"
MF = "references/modelling-formats.md"
LDC = "references/lesson-designer-components.md"
LD = "agents/lesson-designer.md"
REV = "agents/design-reviewer.md"
PREF = "references/preferences.md"
TV = "references/teacher-voice.md"
VAL = "scripts/validate-lesson-design.py"
PACKET = "scripts/design-review-packet.py"
HOW = "`teaching-sequence-content-based.md` → `How this teacher explains`"
ACTUAL = "(an actual good one, such as a model answer or a good paragraph, never a list of what a good one includes)"
T13B = ("success criteria on the board that already show what a good one looks like " + ACTUAL + " stand in for the "
        "good instance, so the launch keeps its case and steps and needs no second model")

ATTACKS = [
    # (name, file, the new text, the text put in its place)
    ("four corners back as a Talk format", DIAL, "- A line on paper from agree to disagree, or a vote with a written reason (`do-beats.md` 6.2 and 6.4)",
     "- Four corners (children physically position themselves on agree / strongly agree / disagree / strongly disagree and defend)"),
    ("a four-corners vote back", DIAL, "a ranking, a sort, a vote with a written reason", "a ranking, a sort, a four-corners vote"),
    ("the movement exception dropped", DB, ", or when the movement is itself what is being learned (standing and making a quarter turn to learn what a quarter turn is).", "."),
    ("the plan may be separated again", TASK, "Planning and doing continue as one flowing task, with any check for safety or wasted materials inside it as the teacher's check; the plan gets its own beat only when it produces something children need before they start (a fair-test plan, a labelled design).",
     "Planning and doing may continue as one flowing task unless separating the plan materially improves the work or protects one of those important conditions."),
    ("Look for asks for every gap again", ET, "Put the one link most children skip, and the question to ask at it, in `speakerNotes.lookFor` on the task beat, inside its 25 words:",
     "Put those questions in `speakerNotes.lookFor` on the task beat, naming the links most likely to be skipped and the question to ask at each:"),
    ("the Look for example over 25 words", ET, "germs make: if a child", "germs make, and then, if a child"),
    ("one short enabling input back", LDC, "after a short enabling input, one idea at a time", "after one short enabling input"),
    ("no answer slide after a live My Turn, back", SKILL, "the finished helper follows on the next slide as the unit's answer (`modelling-formats.md` → Live-complete helper).", "for My Turn, do not create a following answer slide."),
    ("eight formats and brain dump back", DB, "seven retrieval formats (free recall,", "eight retrieval formats (brain dump,"),
    ("Brain Dump back", DB, "Lower stakes than Free Recall (1.1).", "Lower stakes than Brain Dump."),
    ("synthesis conditional again", ES, "sentence stems and push-back questions are conditional teaching tools", "sentence stems, push-back questions and synthesis are conditional teaching tools"),
    ("the cycles rule unwritten", SKILL, "Run each concept's cycles together, in the order `concepts` lists them.\n\n", ""),
    ("the Talk question rule unwritten", DIAL, "A Talk's `discussionQuestion` is its Stimulus's `question`, word for word.\n\n", ""),
    ("the wrong section named again", LD, "(`teaching-sequence-skill-based.md` → Cycles, and the beats around them, `A step the method needs`)", "(`teaching-sequence-skill-based.md` → Teaching Sequence Specification, `A step the method needs`)"),
    ("Karpyne back", ES, "Roediger & Karpicke", "Roediger & Karpyne"),
    ("full spoken in script back", LD, "keep one takeaway as key line, with the route on the board in whole sentences and said more fully in the script.", "keep one takeaway as key line, full spoken in script."),
    ("a skill lesson left alone again", VAL, "    for index, unit in enumerate(sequence):\n        beat = _SUBSTANTIAL_TASKS.get(unit.get(\"kind\"))",
     "    if structure == \"Skill-based\":\n        return\n    for index, unit in enumerate(sequence):\n        beat = _SUBSTANTIAL_TASKS.get(unit.get(\"kind\"))"),
    ("every turn counts again", VAL, "    if kind in {\"my-turn\", \"our-turn\"}:\n        if not _EXPLAINS.search", "    if kind in {\"my-turn\", \"our-turn\"}:\n        return True\n        if not _EXPLAINS.search"),
    ("a turn counts without its answer on the board", VAL, "        return revealed or written_live", "        return True"),
    ("round 1: any criteria stand in again", VAL, "        if isinstance(launch, dict) and launch.get(\"goodLooksLike\") is not None:\n            continue\n",
     "        if isinstance(launch, dict):\n            if launch.get(\"goodLooksLike\") is not None:\n                continue\n            if unit.get(\"successCriteriaRefs\"):\n                continue\n"),
    ("round 1: the checklist line out of the message", VAL, "; success criteria that list what a good one \"\n            \"includes are not a good one shown", ""),
    ("round 1: count as one seen back in the home", PREF, "stand in for the good instance, so the launch keeps its case and steps and needs no second model.", "count as one seen, so the launch needs no second model."),
    ("round 1: a checklist may stand in, in the designer's words", LD, "the steps, on the board; " + T13B, "the steps, on the board; success criteria on the board that already show what a good one looks like stand in for the good instance, so the launch keeps its case and steps and needs no second model"),
    ("round 1: the output-block limit dropped", TASK, "what a good one looks like " + ACTUAL + ".", "what a good one looks like."),
    ("round 1: the reviewer's old trigger back", REV, "when the class has not yet seen a good one of this product earlier in this lesson or the enabling input ran to several units", "when the product's form is new to the lesson or the enabling input ran to several units"),
    ("round 1: the reviewer's null launch without decision 2's case", REV, " or the class has already seen a good one of this product earlier in this lesson;", ";"),
    ("round 1: the fault above back", CONTENT, "Saying the same thing three ways is a fault (this section's last paragraph: the landed sentence again in other words);", "Saying the same thing three ways is the fault above;"),
    ("round 1: the same-shape fault above back", CONTENT, "which is saying the same thing three ways, at the level of slides;", "which is the same-shape fault above at the level of slides;"),
    ("round 1: the null claim unqualified", CONTENT, "the validator refuses `null` on a `teach` beat (a task lesson's `teach-needed` keeps its own rule: `null` only when the idea and its instance already carry the meaning).", "the validator refuses `null`."),
    ("Do the task not checked", VAL, '_SUBSTANTIAL_TASKS = {"practise": "Practise", "do-task": "Do the task"}', '_SUBSTANTIAL_TASKS = {"practise": "Practise"}'),
    ("a Do the task's description searched for the word", VAL, "    return unit.get(\"kind\") == \"practise\" and bool(_EXPLAINS.search(content.get(\"format\") or \"\"))",
     "    return bool(_EXPLAINS.search((content.get(\"format\") or \"\") + \" \" + (content.get(\"activity\") or \"\")))"),
    ("rehearsal no longer marks an explanation", VAL, "if content.get(\"reasoningWords\") or content.get(\"rehearsal\"):", "if content.get(\"reasoningWords\"):"),
    ("the turn-label message without his maths ruling", VAL, "In maths \"\n                f\"the plain words are what the teacher wants ('{word}'); in other subjects name \"\n                f\"the move after them ('{word} - Where does the comma go?')\"",
     "Name \"\n                f\"the move after them ('{word} - Where does the comma go?')\""),
    ("the Teach message's old order", VAL, "the route this teacher usually walks after the sentence the slide lands, the because or so that explains it, then an example on the board or what it does not mean",
     "the route from what the class already has, through the thing on the board, to the sentence the slide lands"),
    ("a skill explanation unread by the view", PACKET, 'ACTIVITY_IS_READ_PREPARE_MODES = {"explanation"}', "ACTIVITY_IS_READ_PREPARE_MODES = set()"),
    ("modelledOn unread by the view", PACKET, '    "enablingInput",\n    "modelledOn",\n', '    "enablingInput",\n'),
    ("the designer's child-facing list without them", LD, "; so is a skill `prepare` unit's `activity` in `explanation` mode, which is the explanation children read on the board, and a task lesson's `modelledOn`, the instance its teaching is shown on.", "."),
    ("the heading renamed", CONTENT, "### How this teacher explains", "### How the teacher explains"),
    ("the launch heading dropped", CONTENT, "### The launch\n\n", ""),
    ("the bold sentence back", CONTENT, "**This is how this teacher usually explains anything, on a Teach board in any kind of lesson or wherever else something is explained: the takeaway, then a because or so that explains that one key point, then an example or what it does not mean.** It is how he usually explains, not a template, and the board reads that way unless the beat has a reason not to. ",
     "**The shape this teacher teaches in, more often than not, is four parts in this order, and the board should read that way unless the beat has a reason not to.** "),
    ("the discovery exception dropped", CONTENT, ", and a discovery lesson lands its takeaway at the end, because children reach it themselves (`teaching-sequence-discovery.md` → Teach why).", "."),
    ("the skill output line dropped", SKILL, "A `teach` beat takes the knowledge route's Teach fields, and its `explanation` explains as " + HOW + " says, kept brief on the board as `Cycles, and the beats around them` says. A `practise` beat takes the knowledge route's Practise fields, and its `launch` is written as that file's `The launch` says.\n\n", ""),
    ("the skill explanation's three-line shape back", SKILL, "two or three short lines on the board, the way this teacher explains (" + HOW + ")", "two or three short lines on the board (what the idea means, why it matters, what it looks like)"),
    ("the task explanation's three-line shape back", TASK, "in two or three short lines, the way this teacher explains (`teaching-sequence-content-based.md` → How this teacher explains);", "in two or three short lines: what it means, why it matters, what it looks like;"),
    ("discovery's end dropped", DISC, ", with the takeaway landing at the end, because children reach it themselves.", "."),
    ("the grounding input pointer dropped", DIAL, "When the input explains something rather than naming it, it explains the way this teacher explains (" + HOW + ").\n\n", ""),
    ("the designer's read line dropped", LD, "read `teaching-sequence-content-based.md::The launch` the same way.", "read the launch the same way."),
    ("the walk-through names the field again", LD, "in the order and with the exceptions " + HOW + " gives)", "in the order and with the exceptions `teaching-sequence-content-based.md` → `explanation` gives)"),
    ("the reviewer names the field again", REV, "Read each Teach board for the four parts the teacher teaches in (" + HOW + "):", "Read each Teach board for the four parts the teacher teaches in (`teaching-sequence-content-based.md` → `explanation`):"),
    ("the preferences pointer names the field again", PREF, "(" + HOW + " owns the four parts and their exceptions)", "(`teaching-sequence-content-based.md` → `explanation` owns the four parts and their exceptions)"),
    ("the voice guide's pointer dropped", TV, "An explanation usually goes the way this teacher explains (" + HOW + "); that is how he usually explains, not a template.\n\n", ""),
    ("13b gone from the home", PREF, " " + T13B[0].upper() + T13B[1:] + ".", ""),
    ("13b gone from the designer's rhythm line", LD, "the steps, on the board; " + T13B + " (", "the steps, on the board ("),
    ("13b gone from the reviewer", REV, "; " + T13B + ", and the program cannot see whether they do, so judge that from the criteria beside the task (", " ("),
    ("a familiar form skips the launch again", TASK, "`launch` is null only when children can begin from the task's question alone, or when an earlier beat of this lesson has already shown the class a good one of this product (a model answer revealed on the board, or an earlier launch).",
     "A task children can begin from its question alone, because the enabling input was one unit and the product form is familiar, leaves `launch` null."),
    ("the made-it trigger back", TASK, "or the class has not yet seen a good one of this product in this lesson", "or the product has a form children have not yet made in this lesson"),
    ("the content output block without the second case", CONTENT, "`launch` is `null` when children can begin from the question alone, or when an earlier beat of this lesson has already shown the class a good one of this product, and",
     "`launch` is `null` when children can begin from the question alone, and"),
    ("the rubbing-out story back", SKILL, "Two examples completed live on one figure is one slide the teacher has to rub out mid-lesson, so plan a figure each.** The unit stays one unit; what changes is that its examples do not share a drawn helper.",
     "Two examples completed live on one figure is one slide the teacher has to rub out mid-lesson, so plan a figure each.** The unit stays one unit; what changes is that its examples do not share a drawn helper. A Year 4 nearest-1,000 design put `3,462` and `3,500` in one My Turn with a representation configuration saying two questions on the same interval use one line, and the teacher who met that shape in class said the rubbing out was the slowest part of the lesson (19 September 2026)."),
    ("the tooth story back", CONTENT, "A picture with a label and one fact lets a teacher reading the board aloud say where the thing is and nothing else, so the children learn a label rather than what it names.",
     "A Year 4 science slide showed a tooth cross-section, labelled `Enamel`, headed `Inside a tooth`, and landed `Enamel forms a hard protective covering over the top of a tooth.` The children learn a label rather than a layer."),
    ("the cover teacher story back", MF, "never only in the notes. The teacher who completed it live skips that slide; a teacher who did not, or could not write on the board, teaches from it.",
     "never only in the notes. The teacher who completed it live skips that slide; a teacher who did not, or could not write on the board, teaches from it. The blank alone used to count as enough wherever the teacher could draw live, and a cover teacher given a Year 4 rounding deck of blank number lines had nothing finished to show the class (17 September 2026)."),
    ("the printed record story back", DB, "A sort has a field for its handling and a written task does not, so preparation can end up decided by which beat happens to have a schema slot.",
     "A Year 4 history beat on 17 September 2026 gave every child a printed record to complete. A sort has a field for its handling and a written task does not, so preparation can end up decided by which beat happens to have a schema slot."),
    ("the Our Turn ruling's date back", SKILL, "the criteria and the number line and nothing else.", "the criteria and the number line and nothing else (the user, 12 September 2026)."),
    ("Pose Pause Pounce Bounce back", DB, "- Pashler, H. et al. (2007).", "- McGill, R. M. (2011). *Pose Pause Pounce Bounce* — teachertoolkit.co.uk, attributed to Pam Fearnley.\n- Pashler, H. et al. (2007)."),
]

lines = []
ok, tail = run_tests()
lines.append(f"untouched copy: {'passes' if ok else 'FAILS'} ({tail})")
print(lines[-1])
assert ok, "the untouched copy must pass first"
caught = 0
for name, rel, new, old in ATTACKS:
    path = COPY / rel
    original = path.read_bytes()
    text = original.decode("utf-8")
    crlf = "\r\n" in text
    needle = new.replace("\n", "\r\n") if crlf else new
    count = text.count(needle)
    if count != 1:
        lines.append(f"NOT RUN ({count} matches): {name}")
        print(lines[-1])
        continue
    path.write_bytes(text.replace(needle, old.replace("\n", "\r\n") if crlf else old).encode("utf-8"))
    passed, tail = run_tests()
    path.write_bytes(original)
    caught += not passed
    lines.append(f"{'caught' if not passed else 'MISSED'}: {name} ({tail})")
    print(lines[-1])

same = all((REPO / "plugins" / "lesson-v4" / rel).read_bytes() == (COPY / rel).read_bytes()
           for rel in {a[1] for a in ATTACKS})
lines.append(f"{caught} of {len(ATTACKS)} caught; the copy restored byte for byte: {same}")
print(lines[-1])
(OUT / "undo.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
