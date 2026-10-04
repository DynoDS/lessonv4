"""The voice guide release: undo each change on a scratch copy and see a test fail.

    python -X utf8 vg_13_undo_checks.py

Copies this branch's plugin (without `node_modules`) and the ledgers the pin
tests read into `plans/streamline-tools/scratch/vg/undo/`, runs the tests once
on the untouched copy (they must pass, or every attack would be caught for the
wrong reason), then makes one attack at a time: a replacement in one file of
the copy, the tests run, the file restored. Each attack must make a test fail.
Nothing in this branch's tree is written."""
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "vg" / "undo"
print(f"branch: {REPO}")
print(f"attacking a copy in {OUT}")
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(REPO / "plugins" / "lesson-v4", OUT / "plugins" / "lesson-v4",
                ignore=shutil.ignore_patterns("node_modules", "__pycache__", ".pytest_cache", "out"))
(OUT / "plans").mkdir(parents=True)
for ledger in (REPO / "plans").glob("2026-09-2*-ledger.md"):
    shutil.copyfile(ledger, OUT / "plans" / ledger.name)
PLUGIN = OUT / "plugins" / "lesson-v4"

TESTS = [
    "scripts/tests/test_teacher_voice_ledger_is_kept.py",
    "scripts/tests/test_voice_reaches_every_string.py",
    "scripts/tests/test_invented_people_and_the_spoken_question.py",
    "scripts/tests/test_make_lesson_runtime.py::MakeLessonRuntimeTests::"
    "test_focused_repair_entrypoints_are_compact_and_keep_owner_models",
    "scripts/tests/test_assumed_knowledge_ledger_is_kept.py",
    "scripts/tests/test_vocabulary_ledger_is_kept.py",
    "scripts/tests/test_starters_sticky_apply_ledger_is_kept.py",
    "scripts/tests/test_teach_then_do_ledger_is_kept.py",
    "scripts/tests/test_quick_checks_ledger_is_kept.py",
    "scripts/tests/test_worksheets_ledger_is_kept.py",
]


def run() -> bool:
    proc = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", "-q", "-x", "-p", "no:cacheprovider"] + TESTS,
                          cwd=PLUGIN, capture_output=True, text=True, encoding="utf-8")
    return proc.returncode == 0


assert run(), "the untouched copy fails: fix the copy before attacking it"
print("untouched copy: every test passes")

TV = "references/teacher-voice.md"
LD = "agents/lesson-designer.md"
PREF = "references/preferences.md"
D = chr(0x2014)
ATTACKS = [
    ("the route loses §7", TV, "a definition or explanation §5, a sentence stem or other support §7,",
     "a definition or explanation §5,"),
    ("the route loses §14", TV, ", and §14 once, when the kind of lesson is settled.", "."),
    ("the route says the two most often missed again", TV, "are two of the four most often missed",
     "are the two most often missed"),
    ("definitions and scripts leave the route", TV, " **Definitions and scripts are the other two**, because a "
     "definition feels like a structured field being filled and a script feels like notes rather than writing; both "
     "are words a child reads or hears, and both are where the register slips first.", ""),
    ("the reason that stayed is dropped", TV, " Every one was written by an agent that had read each section it was "
     "routed to.", ""),
    ("the designer keeps its own copy of the route again", LD, "by the route its `How to read this file` sets out",
     "by its core sections"),
    ("the designer's first-script line to §16H goes", LD, "Read `teacher-voice.md` §16H before the first script of a "
     "lesson: ", ""),
    ("the case clause goes", PREF, " Before the case means before the question about it: when the thing is on the "
     "board, the sentence about the thing in view comes first and the general one straight after.", ""),
    ("his chipped-tooth order is swapped", TV, "> This tooth has lost a piece of enamel.\n> Sometimes, teeth can be "
     "chipped or broken if they take a hard knock.", "> Sometimes, teeth can be chipped or broken if they take a hard "
     "knock.\n> This tooth has lost a piece of enamel."),
    ("the slide designer's trigger narrows again", "agents/slide-designer.md", ", a prediction to judge, an "
     "advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a question.",
     " or advice-to-a-character move."),
    ("the repair role's trigger narrows again", "agents/slide-designer-focused-repair.md",
     ", or anyone who simply says what they think, gives their reason or asks a question:", ":"),
    ("the playbook's trigger narrows again", "references/slide-composition-playbook.md",
     ", or anyone who simply says what they think, gives their reason or asks a question, read", ", read"),
    ("the guidance's own list changes, so the triggers no longer copy it", "references/slide-speech-and-characters.md",
     "a disagreement, a prediction to judge,", "a disagreement,"),
    ("humour loses maths and PSHE", TV, ", in every subject, maths and PSHE included: in the teacher's words, "
     "\"Humour wherever\" and \"humour is allowed in pshe\".", "."),
    ("\"never maths\" comes back as an instruction", TV, "## When to keep it straight\n",
     "## When to keep it straight\n\nIn maths: never maths.\n"),
    ("the melons line goes", TV, "> Priya's bought forty-seven melons. We won't ask why.", "> Priya bought melons."),
    ("the sensitive-issue limit goes", TV, "- never make the actual sensitive issue the joke;\n", ""),
    ("the log's \"never maths\" sentence goes", "references/build-review-log.md", "\"never maths\" no longer stands",
     "\"never maths\" is reconsidered"),
    ("the class code comes back", LD, "Give it a name the first time it appears, and not always a class code like "
     "`Class 4B` (`Oak Class`, `the class at Hilltop School`, `the Hill Road team`), and",
     "Give it a plain ordinary name the first time it appears (`Class 4B`, `the Hill Road team`) and"),
    ("the guide's class clause goes", TV, " A class the lesson comes back to gets a name the first time, and not "
     "always a class code like `Class 4B` (`Oak Class`, `the class at Hilltop School`), and keeps it.", ""),
    ("the discussion clause goes", "references/teaching-sequence-dialogic.md",
     " The discussion itself is not scripted; the words that open and frame it are.", ""),
    ("the designer says never the reverse again", LD, "not normally the reverse", "never the reverse"),
    ("preferences say not the other way round again", PREF, "- not normally the other way round.",
     "- not the other way round."),
    ("the guide's own \"normally\" goes", TV, "Do not normally reverse this relationship.",
     "Do not reverse this relationship."),
    ("the adaptation reference's repeat comes back", "references/adaptive-adaptation.md",
     "naturally. Do not turn Below wording", "naturally. Keep necessary subject vocabulary and use accessible support "
                                            "around it. Do not turn Below wording"),
    ("the adaptation designer's pointer drops its limit", "agents/adaptation-designer.md",
     "as Written Voice's Below paragraph says: supported, not automatically replaced.",
     "where it helps."),
    ("the staging note says the teacher line above again", TV, "belongs in a teacher line of its own (a caveat or a "
     "safeguarding note in the teacher information below the script, a staging line for a model finished live in "
     "`On the board:` above it)", "belongs in the teacher line above"),
    ("the em dash goes back on the avoid-unless list", TV, "- making every slide follow the same sentence formula;\n\n"
     "**Never use em dashes and en dashes** in anything",
     "- making every slide follow the same sentence formula;\n- em dashes and en dashes in anything"),
    ("the hand-off stops naming §16H", PREF, ", and two full-length scripts in `teacher-voice.md` §16H.", "."),
    ("\"That section\" comes back", LD, "`preferences.md` → Vocabulary is the one place", "That section is the one place"),
    ("the Maintenance note comes back into §17", TV, "rather than mechanically even?**\n",
     "rather than mechanically even?**\n\n---\n\n## Maintenance\n\nTreat this guide as the default runtime "
     "specification.\n"),
    ("the one sentence every reader needs leaves the guide", TV, " Treat this guide as the default runtime "
     "specification.", ""),
    ("the harness read-me calls the held-out file empty again", "evals/teacher-voice/README.md",
     "carries the strings of the next fresh lessons, waiting", "is an empty structure for the next fresh lesson, waiting"),
    ("the sweep runner says the paragraph before again", "evals/teacher-voice/sweep-runner.md",
     "and the paragraph in its opening section, `Material-defect boundary`, that begins",
     "and the paragraph before it that begins"),
    ("his speaker-notes words leave §2", TV, "\"speaker notes are as long as the idea needs, of course, and they're "
     "also conversational, so it links them nicely. It's talking to children. It just needs to think how can I talk "
     "to children to get them to understand it.\"", "\"notes should be conversational\""),
    ("a quoted line from his lesson is reworded", TV, "Does the acid stop there? No. It keeps going.",
     "Does the acid stop there? It does not."),
    ("more of the deck is copied into the guide", TV, "- **It asks, and answers, so the class thinks along**:",
     "- `Hands up if you cleaned your teeth this morning.`\n- **It asks, and answers, so the class thinks along**:"),
    ("the speaker-notes part moves out of §2", TV, "### As long as the idea needs, said to these children\n",
     "# 2b. Notes\n\n### As long as the idea needs, said to these children\n"),
    ("a date comes back", TV, "It doesn't sound human\". A clipped", "It doesn't sound human\" (14 September 2026). "
                                                                     "A clipped"),
    ("the story comes back", TV, "Questions and comparison prompts missed this way have reached real children.",
     "Three reached real children. `Choose a job.` was answered `Fireman`."),
    ("the RE slide is told as an incident again", TV, "A Year 4 slide that prints `What do their reasons share?`",
     "A Year 4 RE slide printed `What do their reasons share?`"),
    ("his stem example is corrected", TV, "> The circuit will not work because...", "> The circuit won't work because..."),
    ("his criteria example gains its To", TV, "**LO: Write a setting description**", "**LO: To write a setting "
                                                                                      "description**"),
    ("a dash comes back in an activity example", "references/do-beats.md", "Which is the odd one out, and why?",
     "Which is the odd one out " + D + " and why?"),
    ("a dash comes back in a preferences example", PREF, "true or false: felt blocks",
     "true or false " + D + " felt blocks"),
    ("the slide designer's repair grows past its wider budget", "agents/slide-designer-focused-repair.md",
     "## Start narrow\n", "## Start narrow\n\n" + ("Padding. " * 30) + "\n"),
    ("another repair role grows past the usual budget", "agents/working-wall-designer-focused-repair.md",
     "## Start narrow\n", "## Start narrow\n\nPadding padding.\n"),
    ("the route drops the critique prompt again", TV, "a comparison or critique prompt §12", "a comparison prompt §12"),
    ("the lesson length is overstated again", TV, "ran to about a hundred and fifty words",
     "ran to nearly two hundred words"),
    ("a paragraph slips in under the guide's title", TV, "# Teacher Voice Guide\n",
     "# Teacher Voice Guide\n\nMaths lessons stay straight: no light lines in maths.\n"),
    ("the designer's notes voice says short sentences again", LD, "as long as the idea needs and conversational, in "
     "words the children in this class follow (the teacher: \"it doesn't have to be short sentences\"),",
     "clear simple language a nine-year-old follows easily, short straightforward sentences,"),
    ("the hand-off loses his words", PREF, " (in the teacher's words, \"speaker notes are as long as the idea needs, "
     "of course, and they're also conversational\")", ""),
    ("a sort's groups are for a nine-year-old again", PREF, "one plain sentence a child in this class would follow",
     "one plain sentence a nine-year-old would follow"),
    ("the own-question test is a nine-year-old's again", PREF,
     "answering your own question as a child in this class who has not met", "answering your own question as a "
     "nine-year-old who has not met"),
    ("Greater Depth is read by a nine-year-old again", "agents/adaptation-designer.md",
     "met by a child in this class reading it alone", "met by a nine-year-old reading it alone"),
    ("the Greater Depth example loses its named child", "agents/adaptation-designer.md",
     "(`Is Asha right about all of it?`)", "(`Is she right about all of it?`)"),
    ("the adaptation pointer reads two ways again", "agents/adaptation-designer.md",
     "On a separate Below resource, keep essential subject vocabulary and proper nouns as",
     "Keep essential subject vocabulary and proper nouns on a separate Below resource as"),
    ("the RE example loses its Year 4", TV, "A Year 4 slide that prints", "A slide that prints"),
    ("the repeated-phrase line leaves the notes part", TV, "- **A phrase repeated for rhythm is how speech builds** (the "
     "teacher: \"yes thats fine\"): `It eats away a tiny bit of enamel today, a tiny bit more tomorrow, a tiny bit more "
     "the day after that.` §3's warning against a repeated shape still holds on the written board and page.\n", ""),
    ("the rhythm exception spreads to the board", TV, "is the one exception, and only in speech:",
     "is the one exception, in speech and on the board:"),
]

caught = 0
for name, rel, old, new in ATTACKS:
    path = PLUGIN / rel
    before = path.read_bytes()
    text = before.decode("utf-8")
    assert text.count(old) == 1, f"{name}: the attack's old text is not there once ({text.count(old)})"
    path.write_bytes(text.replace(old, new).encode("utf-8"))
    ok = run()
    path.write_bytes(before)
    caught += not ok
    print(f"{'caught' if not ok else 'MISSED'}: {name}")
assert run(), "the copy did not restore"
print(f"UNDO_CHECKS {caught} of {len(ATTACKS)} caught")
