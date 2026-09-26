"""The voice guide release (topic 8, release 5), step 7: each earlier topic whose
pins this release moved records it in its own ledger (the change plan's section
6: "pins moved in VOC, AK, SC, QC, TD", and the starters list, whose pins held a
dash and the slide designer's trigger). One short section at the end of each
ledger, in prose, so the ledger's own row pattern, which the pin tests read, is
untouched. The voice list gains a short note of what was built, the worksheets
list one for its pin on the Greater Depth line, and topic 7's change plan a note
that 7B no longer carries the lines the lead brought into this release.

Not here: the rest-of-preferences list (`2026-09-23-preferences-rest-ledger.md`)
and the routes list (`2026-09-23-routes-ledger.md`), whose rows quote lines this
release changed but whose own releases have not been built on this tree; the
routes release appends its own notes to both, and to several of the ledgers
below. `vg_10_record_after_merge.py` records those two lists' rows after the
merge; the mapping lists them now.

Unlike the change scripts, this one appends only a section a ledger does not
hold yet, and checks one it does hold is word for word what it would write. So
where the merge with the routes release conflicts at a ledger's end (both
releases append there), take main's side of that ledger and run this again: it
adds this release's section after the routes release's. Line endings are kept at
LF, as the repository keeps text."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
print(f"plans: {PLANS}")

HEAD = "## After the voice guide release (topic 8, release 5, 26 September 2026)"
REL = ("the voice guide release (topic 8, release 5), on the voice guide's list "
       "(`2026-09-23-teacher-voice-ledger.md`), whose mapping is `2026-09-26-teacher-voice-mapping.md`")
S1 = ("its settled item 1: the guide's route names all four most-missed kinds, each with its reason, and the lesson "
      "designer reads the guide by that route instead of keeping a shorter copy of it")
S6 = ("its settled item 6: each copy of \"keep precise subject vocabulary\" keeps its own condition, and the two plain "
      "repeats fold")
DASH = ("its settled item 8: a long dash in an example a child could be given is replaced, because the teacher does "
        "not write one")
D2 = ("its decision 2 (his \"yes\"): \"before the case\" means before the question about it, and when the thing is on "
      "the board the sentence about it comes first and the general one straight after")
D4 = ("its decision 4 (his \"yes\"): the slide designer's three triggers for the speech guidance take its own list, word "
      "for word, so a person who simply says what they think, gives their reason or asks a question opens it")
D11 = ("its decision 11 (his \"Named but not always class 4a 4b etc, jazz it up\"): a class the lesson comes back to "
       "gets a name the first time, and not always a class code (`Oak Class`, `the class at Hilltop School`)")
B1 = ("brought into this release by the lead from release 7B (its B1), in 7B's planned words and his: his "
      "speaker-notes answer on the rest-of-preferences list (\"for the speaker notes it doesn't have to be short "
      "sentences ... speaker notes are as long as the idea needs, of course, and they're also conversational\") and "
      "the voice list's decision 13 (\"the plugin is for years one, two, three, four, five, and six\"), so the reader "
      "is a child in this class")
STORY = ("the standing story rule: the incident left for the build log, where the release copied it first, and one "
         "plain telling stays as the example")

NOTES = {
    "2026-09-22-assumed-knowledge-ledger.md": [
        f"- **AK-B04** (the case-context paragraph) moved with {REL}: after \"One sentence, before the case, ... comes "
        f"off in one spot.\" it now says \"Before the case means before the question about it: when the thing is on "
        f"the board, the sentence about the thing in view comes first and the general one straight after.\" ({D2}).",
        f"- **AK-B27** moved: its example now reads \"Look down your conductor column. What is the same about all of "
        f"them?\" ({DASH}).",
        f"- **AK-F01** (the designer's Before You Design Anything paragraph, pinned whole) moved: an invented group is "
        f"given \"a name the first time it appears, and not always a class code like `Class 4B` (`Oak Class`, `the "
        f"class at Hilltop School`, `the Hill Road team`)\" ({D11}).",
        f"- **AK-G09** moved: the RE slide in the guide's reversal check is now one plain telling, \"... and the board "
        f"gets the clever one, where `share` means something different to a nine-year-old than it does to an adult.\" "
        f"({STORY}).",
        f"- **AK-G19** moved: the lesson designer's notes voice reads \"as long as the idea needs and conversational, in "
        f"words the children in this class follow (the teacher: \"it doesn't have to be short sentences\")\", where it "
        f"said \"clear simple language a nine-year-old follows easily, short straightforward sentences\" ({B1}).",
        f"- **AK-B19 and AK-B20** (the rhythm's own-question test and a sort's two groups) moved: each reader is \"a "
        f"child in this class\" where it was \"a nine-year-old\" ({B1}).",
    ],
    "2026-09-22-quick-checks-ledger.md": [
        f"- **QC-A18** moved with {REL}: the give-an-example prompt reads \"Give me an example (not from my slide) of "
        f"an invertebrate.\" ({DASH}).",
        f"- **QC-B06** (the designer's Before You Design Anything paragraph, pinned whole) moved: an invented group's "
        f"name, as the assumed-knowledge list's AK-F01 ({D11}).",
        f"- **QC-G06, HOME-QC-PREF-19, HOME-QC-PREF-21 and the home record of the rhythm** moved: a sort's two groups "
        f"are said \"in one plain sentence a child in this class would follow\", and the own-question test is answered "
        f"\"as a child in this class who has not met the topic\" ({B1}).",
    ],
    "2026-09-23-starters-sticky-apply-ledger.md": [
        f"- **SA-B18, HOME-SA-PREF-STARTERS-14 and the home record of `## Starters`** moved with {REL}: the starter "
        f"example reads \"true or false: felt blocks more sound than foil\" ({DASH}).",
        f"- **SA-J43 and PF-V16** (the slide designer's reading list, pinned whole) moved: the speech guidance is read "
        f"\"when a unit contains a speaking character, a voiced claim, a misconception, a disagreement, a prediction to "
        f"judge, an advice-to-a-character move, or anyone who simply says what they think, gives their reason or asks a "
        f"question\" ({D4}).",
        f"- **SA-L21 and PF-I06** (the designer's Before You Design Anything paragraph, pinned whole) moved: an invented "
        f"group's name ({D11}).",
    ],
    "2026-09-23-success-criteria-ledger.md": [
        f"- **SC-D42** moved with {REL}: the lesson designer's read line no longer lists the guide's sections one by "
        f"one, so its \"§10 success criteria\" is now the guide's own route, \"success criteria §10\" ({S1}). The "
        f"designer's pointer to the preference sections (the row's second quote) is unchanged.",
    ],
    "2026-09-22-teach-then-do-ledger.md": [
        f"- **TD-C19** (the dialogic route's Talk formats, pinned whole) moved with {REL}: the role-play example reads "
        f"(\"you're [character], what would you say?\") ({DASH}).",
        f"- **TD-J62** moved: the research file's red flag reads (\"here are the seven kinds of influence - copy them "
        f"down\") ({DASH}; the quoted line is a teaching move to avoid, and its dash was not part of what it rejects).",
        f"- **TD-G09, HOME-TD-PREF-19, HOME-TD-PREF-21 and the home record of the rhythm** moved: the same two lines as "
        f"the quick-checks list's QC-G06, each reader now \"a child in this class\" ({B1}).",
    ],
    "2026-09-22-vocabulary-ledger.md": [
        f"- **VOC-C24** moved with {REL}: the lesson designer's read line no longer keeps its own copy of the guide's "
        f"route, so its \"§5 a vocabulary definition or explanation\" is now the guide's \"a definition or "
        f"explanation §5\", and \"Definitions and scripts are the two most often missed, because ...\" moved into the "
        f"guide's route as \"**Definitions and scripts are the other two**, because ...\", its reason word for word "
        f"({S1}).",
        f"- **VOC-A02, DEC-10, HOME-LD-01 and the home record of the designer's `### Vocabulary`** moved: \"That "
        f"section is the one place every vocabulary decision is written\" read as the voice guide's §5, which holds "
        f"none of those decisions, so it now names `preferences.md` → Vocabulary (its settled item 8, out-of-date "
        f"text).",
        f"- **VOC-P02** moved: the adaptation designer's copy now points at Written Voice's Below paragraph, keeping "
        f"both halves: \"On a separate Below resource, keep essential subject vocabulary and proper nouns as Written "
        f"Voice's Below paragraph says: supported, not automatically replaced.\" ({S6}).",
        f"- **VOC-P03** moved: the adaptation reference's plain repeat, two lines above its fuller copy (VOC-P04), is "
        f"cut, and the pin now holds that fuller copy ({S6}).",
    ],
    "2026-09-23-worksheets-ledger.md": [
        f"- **WS-F20** moved with {REL}: Greater Depth wording \"is still met by a child in this class reading it "
        f"alone\", where it said \"a nine-year-old\"; the same paragraph's example now names its child, \"`Is Asha "
        f"right about all of it?`\" ({B1}; the named child is the rest-of-preferences list's PF-N82, fixed in the "
        f"same edit as 7B's plan had it).",
    ],
    "2026-09-23-teacher-voice-ledger.md": [
        "- **Built.** This list's release 5 is built on its side branch: decisions 1, 2, 4, 9 and 10 (turned round), "
        "11 and 12, and settled items 1, 5, 6 and 8, with the stories out and his answer on speaker notes calibrated "
        "on the week 3 science lesson he named. Every row is pinned in `scripts/tests/teacher_voice_ledger_pins.json`; "
        "where each changed row went is `2026-09-26-teacher-voice-mapping.md`; the report is "
        "`streamline-tools/vg-release-report.md`.",
        "- **Decision 13** (a nine-year-old in four places) and his speaker-notes answer in the lesson designer's own "
        "notes line were release 7B's; the lead brought them into this release after its first check, in 7B's "
        "planned words and his, so the designer and the guide no longer pull against each other. 7B no longer "
        "carries them.",
        "- **Left for release 6** (humour on the board, waiting for his answer on `streamline-tools/humour-diagnosis.md`): "
        "the guide's §2 and §17, the look moved to where each board is written, where a light line rides on a board, "
        "and the reviewer's board question. This release carries only the diagnosis's parts it names for release 5: "
        "\"humour wherever\", maths and PSHE included, and the two \"never the reverse\" copies brought to "
        "\"normally\".",
    ],
}

for name, notes in NOTES.items():
    path = PLANS / name
    text = path.read_text(encoding="utf-8")
    assert "\r\n" not in text, name
    section = HEAD + "\n\n" + "\n".join(notes) + "\n"
    if HEAD in text:
        assert text.rstrip("\n").endswith(section.rstrip("\n")) or section in text, f"{name}: a different section"
        print(f"already recorded: {name}")
        continue
    path.write_text(text.rstrip("\n") + "\n\n" + section, encoding="utf-8", newline="\n")
    print(f"recorded: {name} ({len(notes)} notes)")

# Topic 7's change plan: 7B no longer carries the notes voice line or decision
# 13's lines, which the lead brought into this release after its first check.
PLAN7 = PLANS / "2026-09-24-topic-7-change-plan.md"
ANCHOR = "### B1. The speaker notes (PF decision 3; settled item 3; the voice list's decision 13)\n"
NOTE = ("\n**Moved to the voice guide release (topic 8, release 5), 26 September.** The lead brought the lesson "
        "designer's notes voice line (L88), the hand-off's gain of his words, and the voice list's decision 13 (preferences "
        "L218 and L222, the adaptation designer's Greater Depth line with PF-N82's named child) into that release after "
        "its first check, so the designer and the guide no longer pull against each other; 7B no longer carries them. "
        "B1's other part, the hand-off naming the notes' lines in the order they print (settled item 3), stays 7B's.\n")
plan = PLAN7.read_text(encoding="utf-8")
if NOTE.strip() in plan:
    print(f"already recorded: {PLAN7.name}")
else:
    assert plan.count(ANCHOR) == 1, "topic 7's B1 heading is not there once"
    PLAN7.write_text(plan.replace(ANCHOR, ANCHOR + NOTE), encoding="utf-8", newline="\n")
    print(f"recorded: {PLAN7.name}")
print("LEDGER_NOTES_OK")
