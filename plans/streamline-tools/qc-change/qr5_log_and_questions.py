"""4.2.286: the log entry says only what is true, and the open questions are
queued where the next chat will find them."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
log = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
t = log.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:90]
    t = t.replace(old, new)


swap("- **A story kept here as it leaves nothing behind.** A Year 4 RE beat",
     "- **Stories kept here.** A Year 4 RE beat")
swap("which is why the reviewer treats a check whose answer lives only in a script as unprepared. That story had no entry here.\n",
     "which is why the reviewer treats a check whose answer lives only in a script as unprepared. That story had no entry here; it is copied, not retired, because `preferences.md` still tells it where another topic owns it.\n")
swap("The designer keeps the disagreement case and a pointer; the reviewer keeps its own sentences; every permission for a short recall keeps its words and points home.",
     "The designer keeps the disagreement case and a pointer; the reviewer keeps its own sentences; every permission for a short recall keeps its words and gains a pointer that carries both halves of the recall line (a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case).")
swap("It now shows the first beat where children use the teaching in every route (a Do, a Practise, a Use the learning, an Our Turn and a Your Turn beside their My Turn, an enabling input's own instruction), reads sort and evidence-classification answers, and counts the takeaway, including a sticky fact.",
     "It now shows every beat where children use the teaching, in every route, beside everything the class met since the last one: a Do or Practise beside its Teach, a Use the learning beside its Teach why and the result made visible, an Our Turn beside its My Turn and a Your Turn beside both, every Talk beside its own Stimulus and any grounding input, an enabling input's own instruction (never counted against its own answer) and the task after it. It reads sort and evidence-classification answers and a Talk's expected positions, shows an Our Turn's question, and counts the takeaway, including a sticky fact. On the 52 filled saved designs it builds without error, loses nothing the old section showed, and no longer prints a blank question.")
swap("Nine rows of the Teach then Do ledger that this change touched are recorded in its pins with the decision that changed them.",
     "Nine rows of the Teach then Do ledger whose words this change altered are recorded in its pins with the decision that changed them, and five more whose whole-paragraph pins now carry an edit made beside them say so.")
entry_end = "the excuse is gone from everywhere it survived.\n"
swap(entry_end, entry_end + """- **The second reader, on the change.** A fresh agent compared the 41 changed rows with their old words, ran the new view over every saved design and attacked the pins 42 times. Nothing was lost outright. It found: the short recall pointers carried only the half of the recall line that permits (so `cover the board: why does a shadow form?` passed them, though the home sends an idea to a fresh case), now each carries both halves; Two Truths and a Lie had taken half of True or False's limit, now all of it; the home had lost A21's "do not force different answers" and gained an absolute ("the one thing recalled"), both repaired; a sentence permitting a sort of a different apprentice's deal had been added to the contrasts file without a decision, and it failed the same everyday-sense test, so it came out; the label formats lacked the world-map limit; the view counted an enabling input against its own answer and missed an Our Turn's question, later Talks and the task after an instructed input, all repaired and tested. Its 42 attacks found 14 that nothing caught: the short forms of the excuse ("named as a check", "two-minute orientation", "the design says so" outside its one honest use) are now barred, a retired phrase is looked for in the plugin's programs as well as its instructions, the view's reach is tested shape by shape, and two sentences the rule leans on are pinned whole. What no pin catches is left to review: a new paragraph saying the opposite in new words, a deleted test assertion, and a catalogue entry moved whole with its heading.

**Not done yet, and named.** Behaviour is untried on a real run. Three questions are the teacher's, because each changes wording he agreed: the map contrast still calls a label-reading check after a new map skill "an honest recall beat", which the new recall line says is not recall unless the map is off the board; the history contrast's "where the simpler task is right" paragraph now names no simpler task that is right; and five of the eight summary formats still name straight after the Teach as their best use, which their new limit rules out. Out-of-date catalogue text the ledger listed (the "answer-scatter" name, "Brain Dump", the section counts, a quoted reviewer phrase) waits for the topic that folds the catalogue.
""")
log.write_text(t, encoding="utf-8")
print("log ok")

led = REPO / "plans" / "2026-09-22-quick-checks-ledger.md"
lt = led.read_text(encoding="utf-8")
anchor = "## Decisions for Daniel\n"
assert lt.count(anchor) == 1
lt = lt.replace(anchor, """### Open questions from the change (23 September 2026), not yet put to Daniel

1. **The map contrast's label-reading sentence.** Decision 1 took out "named as one" and kept the rest: «a quick label-reading check after a new map skill is an honest recall beat». The new recall line says recall is honest when the answer is off the board, and a label read off a map is on it. Proposal: «a quick label-reading check on a map the lesson has not shown is an honest check».
2. **The history contrast's "where the simpler task is right".** With the orientation permission gone (decision 2) it names no simpler task that is right, though every other contrast does. Proposal: name the quick match of jobs the slide did not show to what each gave the family (the fresh match already in `preferences.md`), or leave it saying only what the sort is not.
3. **Five summary formats' "Best for" lines** (Two Things, 30-Second Expert, One-Sentence Summary, Sketchnote, Headline the Lesson) and Quick Sketch's opening («Pupils draw what was just described») still name straight after the Teach, which their new limit (decision 5) rules out. Proposal: rewrite each to the moment the limit allows (across several chunks, with the teaching off the board).

""" + anchor)
led.write_text(lt, encoding="utf-8")
print("ledger ok")
