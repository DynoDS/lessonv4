"""The design reviewer release (topic 8, release 2), step 7: each earlier topic
whose pins this release moved records it in its own ledger (the change plan's
section 3: "pins moved in AK, QC, SC, TD and VOC with each decision recorded in
its own ledger"; no vocabulary pin held a changed word, and five worksheets pins
did). One short section at the end of each ledger, in prose, so the ledger's own
row pattern, which the pin tests read, is untouched. The voice list, whose rows
quote two reviewer lines this release changed, is told the same way; the design
reviewer's own ledger gains a short note of what was built.

Not here: the rest-of-preferences list (`2026-09-23-preferences-rest-ledger.md`),
whose rows quote sixteen of the changed lines, because release 7A appends its
own closing notes to that ledger and two appends at one file's end conflict at the
merge. `rv_10_record_after_merge.py` records those rows there after the merge;
the mapping lists them now.

Each ledger must not hold the section yet; line endings are kept at LF, as the
repository keeps text."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
print(f"plans: {PLANS}")

HEAD = "## After the design reviewer release (topic 8, release 2, 26 September 2026)"
REL = ("the design reviewer release (topic 8, release 2), on the design reviewer's list "
       "(`2026-09-23-design-reviewer-ledger.md`), whose mapping is `2026-09-26-design-reviewer-mapping.md`")
D2 = ("his decision 2 there (24 September 2026, \"1. y\"): small wording fixes are the reviewer's, and a picture swap or "
      "a rewritten Do beat goes to the lesson designer with the reviewer naming the fix")
S11 = ("its settled item 11: a dated story leaves for the build log, where the release copied its sentences first, and "
       "its reason stays")
S10 = "its settled item 10: one copy of each rule"
S4 = ("its settled item 4 (his words: \"Judge the board first ... board first, speaker notes separate\"): the visible "
      "explanation is judged first, on its own, and the spoken one separately")
READER = ("the lead's reading of his words, not his own wording (he said \"I actually don't know why it says "
          "nine-year-old. Um, because the plugin is for years one, two, three, four, five, and six, right?\" of other "
          "lines on the rest-of-preferences list, 24 September): the reader the voice sweep imagines is the actual child "
          "in this class")

NOTES = {
    "2026-09-22-assumed-knowledge-ledger.md": [
        f"- **AK-A49** (the reviewer's section 4 list, pinned whole) moved with {REL}: the bullet \"each moment carries "
        f"only what the class can take in at once (the User-fit judgement above owns that test; do not run it twice)\" "
        f"is cut by {S10}, since the User-fit judgement owns the amount test (RV-K09).",
        f"- **AK-G21** moved with the voice sweep's reader: \"the actual eight- or nine-year-old the year group names\" "
        f"is now \"the actual child in this class\" ({READER}; RV-G09).",
        f"- **AK-K01** (the reviewer's reading list, pinned whole) moved: step 8 keeps its reason, \"A string read inside "
        f"JSON braces beside its field name is read as a specification.\", and the incident after it left for the log "
        f"({S11}; RV-F09).",
    ],
    "2026-09-22-quick-checks-ledger.md": [
        f"- **QC-C08, QC-E11 and QC-P01** (the reviewer's section 3 list, pinned whole) and **QC-D08** moved with {REL}. "
        f"A Do that says its Teach back now reads \"The repair keeps the chunk and is the Lesson Designer's, because it "
        f"changes what children have to think: return it naming the fix, which asks for the because, ...\", the list "
        f"of repairs and both pointers unchanged ({D2}; RV-J34); and \"The design now states this in each unit's "
        f"`unlocks`\" lost \"now\" (its settled item 5, out-of-date text; RV-J18).",
    ],
    "2026-09-23-success-criteria-ledger.md": [
        f"- **SC-Q01** (the reviewer's section 3 list, pinned whole) moved with {REL}: the same two sentences as the "
        f"quick-checks list's QC-C08 (the restating Do goes back to the lesson designer, {D2}; \"now\" left the "
        f"`unlocks` line). No success-criteria wording changed.",
    ],
    "2026-09-22-teach-then-do-ledger.md": [
        f"- **TD-L07 and TD-L09** (the reviewer's section 3 list, pinned whole) moved with {REL}: the restating Do goes "
        f"back to the lesson designer ({D2}; RV-J34), and \"now\" left the `unlocks` line (RV-J18).",
        f"- **TD-L10** (the reviewer's Teach-board paragraph, pinned whole) moved: \"Amount catches too much; this "
        f"catches too little.\" ends there, the Tudor deck of 14 September leaving for the log (RV-C08); and the two "
        f"lessons of 22 September left too, their two script lines staying as plain examples of the finding (RV-C13); "
        f"both by {S11}. The paragraph's example written as an instruction to look (RV-C10) stays the reviewer's own "
        f"repair, word for word, by his answer of 26 September (\"yes\" to the reviewer rewriting \"Look at the "
        f"diagram.\" itself as what children will notice).",
    ],
    "2026-09-23-worksheets-ledger.md": [
        f"- **WS-I05** (the reviewer's section 4 list, pinned whole) moved with {REL}: the amount bullet is cut ({S10}; "
        f"RV-K09).",
        f"- **WS-Q02, WS-Q08, HOME-WS-REV-03 and the home record of the reviewer's section 5** moved, and **WS-Q10 and "
        f"WS-Q11** with them: the two stories this list's change plan left to that release (its Q10 and Q11) are "
        f"gone, {S11}. Q10's instruction stays as \"Read the forms rather than confirming the objective matches.\", and "
        f"Q11's teeth sheet stays as a plain undated example: \"is the shape this check exists to catch, as in a *name "
        f"the layers of teeth* sheet that asked for three names on three ruled lines under an unused diagram.\"",
    ],
    "2026-09-23-teacher-voice-ledger.md": [
        f"- **VG-O25**: the reason a wrong-register string is not polish ended \"and today the teacher edits it out by "
        f"hand\", a moment written as a reason; it now says \"and the teacher would have to edit it out by hand\" ({REL}, "
        f"{S11}; RV-D06).",
        f"- **VG-O26**: \"Read each one first as the child: the actual eight- or nine-year-old the year group names\" is "
        f"now \"Read each one first as the child: the actual child in this class\" ({READER}; RV-G09).",
    ],
    "2026-09-23-design-reviewer-ledger.md": [
        "- **Built on its side branch**, the change plan's release 2 (`2026-09-24-topic-8-change-plan.md`, section 3): "
        "every decision and settled item there, with his words as the standard. Where each row went is in "
        "`2026-09-26-design-reviewer-mapping.md`; the pins are `scripts/tests/design_reviewer_ledger_pins.json`, with "
        "`test_design_reviewer_ledger_is_kept.py`; the scripts and the report are in `streamline-tools/rv-change/` and "
        "`streamline-tools/rv-release-report.md`.",
        "- **Rows earlier releases changed after this list's snapshot**, mapped to the words they left: RV-S39 (the "
        "success-criteria release), RV-K10, L02, L08 and T22 (the worksheets release), RV-T05 to T08 (the "
        "subject-files release, recorded above).",
        "- **Rows release 7A changes** (RV-H12, H14, J48, K02, S05, S25, T11; its mapping's last section) follow its "
        "words when the mapping is rebuilt on the merged tree.",
    ],
}

for name, lines in NOTES.items():
    path = PLANS / name
    text = path.read_text(encoding="utf-8")
    assert HEAD not in text, name
    assert "\r\n" not in text, name
    path.write_text(text.rstrip("\n") + "\n\n" + HEAD + "\n\n" + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print("recorded in", name)
