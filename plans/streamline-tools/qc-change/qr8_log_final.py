"""4.2.286: the log entry after the second check, every claim matched to the files."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
log = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
t = log.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:90]
    t = t.replace(old, new)


swap("every permission for a short recall keeps its words and gains a pointer that carries both halves of the recall line (a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case).",
     "every permission for a short recall keeps its words and gains a pointer that carries both halves of the recall line (a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case), except the catalogue's sort permission, whose pointer carries the sort's own condition (the cards are cases the Teach did not show).")
swap("It now shows every beat where children use the teaching, in every route, beside everything the class met since the last one: a Do or Practise beside its Teach, a Use the learning beside its Teach why and the result made visible, an Our Turn beside its My Turn and a Your Turn beside both, every Talk beside its own Stimulus and any grounding input, an enabling input's own instruction (never counted against its own answer) and the task after it.",
     "It now shows the first beat where children use each piece of teaching, in every route, beside everything the class met since the last pupil beat: a Do or Practise beside its Teach, every Use the learning beside its Teach why and the result made visible, an Our Turn beside its My Turn and a Your Turn beside its whole cycle, every Talk beside its own Stimulus and any grounding input, a combined stimulus and talk beside the grounding before it, a planning checkpoint, and an enabling input's own instruction (never counted against its own answer) and the task after it. A Practise that follows a Do is not shown again, because the teaching it follows was already read beside that Do.")
swap("- **Size, honestly.** The instruction files are about 5.7 KB larger, and the review packet's code about 3.9 KB:",
     "- **Size, honestly.** The instruction files are about 6.3 KB larger, and the review packet's code about 6.4 KB:")
swap("the short forms of the excuse (\"named as a check\", \"two-minute orientation\", \"the design says so\" outside its one honest use) are now barred, a retired phrase is looked for in the plugin's programs as well as its instructions,",
     "the short forms of the excuse are now barred (\"named as a check\" and \"named as a quick check\" everywhere; \"two-minute orientation\", \"named as one\" and \"the design says so\" only in the files they left, because each is ordinary English elsewhere and the last has an honest use in the vocabulary section), a retired phrase is looked for in the plugin's top-level Python programs as well as its instructions,")
swap("What no pin catches is left to review: a new paragraph saying the opposite in new words, a deleted test assertion, and a catalogue entry moved whole with its heading.\n",
     "What no pin catches is left to review: a new paragraph saying the opposite in new words, a retired phrase with a word inserted, emphasis added or split across two joined strings (a bar is a literal string), a builder JavaScript file, a deleted test assertion, and a catalogue entry moved whole with its heading.\n- **The third reader, on the repairs.** A second fresh agent re-checked the repairs, ran the view over all 54 saved designs (every old section kept, no count fell, no blank question) and attacked the pins 38 more times. It found the view still missed a combined stimulus and talk's grounding, a second finding's result, a planning checkpoint and an old-shape Your Turn's cycle; the bars refused honest English; the removed apprentice sentence was not barred; decision 10's two incidents and the designer's diagram list were not done; and the size figures were stale. All are now done, tested or named here.\n")
swap("and five of the eight summary formats still name straight after the Teach as their best use, which their new limit rules out.",
     "and five of the eight summary formats still name straight after the Teach as their best use, Quick Sketch opens on drawing \"what was just described\", and Diagram to Words keeps \"the check that a picture children copied actually means something to them\", each of which the new limits rule out.")
swap("Out-of-date catalogue text the ledger listed (the \"answer-scatter\" name, \"Brain Dump\", the section counts, a quoted reviewer phrase) waits for the topic that folds the catalogue.\n",
     "Out-of-date catalogue text the ledger listed (the \"answer-scatter\" name, \"Brain Dump\", the section counts, a quoted reviewer phrase) waits for the topic that folds the catalogue; so do a sort item's `detail`, which the view does not print, and the stick-in pedagogy's \"a genuine retrieval task\" for the blank world map, which the new label rule calls the check.\n")
log.write_text(t, encoding="utf-8")
print("log ok")

led = REPO / "plans" / "2026-09-22-quick-checks-ledger.md"
lt = led.read_text(encoding="utf-8")
old = "and Quick Sketch's opening («Pupils draw what was just described») still name straight after the Teach, which their new limit (decision 5) rules out."
assert lt.count(old) == 1
lt = lt.replace(old, "and Quick Sketch's opening («Pupils draw what was just described») still name straight after the Teach, which their new limit (decision 5) rules out; Diagram to Words keeps «and as the check that a picture children copied actually means something to them», which decision 6's condition now pulls against.")
led.write_text(lt, encoding="utf-8")
print("ledger ok")

plan = REPO / "plans" / "streamline-plan.md"
pt = plan.read_text(encoding="utf-8")
old = "Instruction files +5.7 KB, packet code +3.9 KB. |"
assert pt.count(old) == 1
pt = pt.replace(old, "Instruction files +6.3 KB, packet code +6.4 KB. |")
old = "second check of the repairs running (`quick-checks-repair-check.md`)"
assert pt.count(old) == 1
pt = pt.replace(old, "second check done and repaired (`quick-checks-repair-check.md`)")
plan.write_text(pt, encoding="utf-8")
print("plan ok")
