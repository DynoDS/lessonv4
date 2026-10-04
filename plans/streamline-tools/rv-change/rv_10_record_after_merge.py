"""The design reviewer release (topic 8, release 2), after the merge with
release 7A: the rows of two topic 7 lists this release changed are recorded in
their own ledgers, the way `rv_07_record_in_ledgers.py` recorded the earlier
topics' rows (one short closing section in prose, so no ledger's row pattern
changes). Run once, on the merged tree, by `rv_09_follow_at_merge.py`.

Not run on the side branch: 7A appends its own closing notes to both ledgers,
and two appends at one file's end conflict at the merge.

- The rest of preferences (`2026-09-23-preferences-rest-ledger.md`): sixteen
  rows quote reviewer lines this release changed; no pin holds them.
- Starters, sticky knowledge and Apply (`2026-09-23-starters-sticky-apply-ledger.md`):
  its pin SA-M08 holds the reviewer's section 3 list whole, and followed this
  release's two sentences in it (`rv_06_repin_other_topics.py`)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
REV = REPO / "plugins" / "lesson-v4" / "agents" / "design-reviewer.md"
print(f"plans: {PLANS}")

SEVEN_A = "a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;"
assert SEVEN_A in " ".join(REV.read_text(encoding="utf-8").split()), "run this on the tree merged with release 7A"

HEAD = "## After the design reviewer release (topic 8, release 2, 26 September 2026)"
REL = ("the design reviewer release (topic 8, release 2), on the design reviewer's list, whose mapping "
       "(`2026-09-26-design-reviewer-mapping.md`) names each row it changed")
D2 = "its decision 2 (a picture swap or a rewritten Do beat goes to the lesson designer, with the reviewer naming the fix)"
S11 = "its settled item 11 (a dated story leaves for the build log, where it was copied first; the reason stays)"
S10 = "its settled item 10 (one copy of each rule)"

NOTES = {
    "2026-09-23-preferences-rest-ledger.md": [
        f"- These rows quote reviewer lines changed by {REL}. None is pinned; each row's own words still describe the "
        f"rule, and the change is as the reviewer's row says.",
        f"- **Decision 2:** PF-S25 (RV-M14, a photograph of a tool the engine draws) now goes back to the Lesson "
        f"Designer with the fix named; PF-G28 lost \"now\" from \"The design now states this\" (RV-J18, its settled "
        f"item 5). PF-Q25 (RV-C10, a Teach example written as an instruction to look) is unchanged: by his answer of "
        f"26 September it stays the reviewer's own wording fix.",
        f"- **Decision 7:** PF-O20 (Slide Philosophy's trigger, RV-S16), PF-S11 (the visual-need trigger, RV-S22) and "
        f"PF-N14 (Source and Scenario Integrity's trigger, RV-S30) each gained a sentence naming the case it now opens "
        f"for; their earlier words are unchanged.",
        f"- **Settled item 4:** PF-O21 (RV-I07): the visible explanation is judged first, on its own, and the spoken one "
        f"separately.",
        f"- **Settled items 10 and 11:** PF-W23 (RV-K09) is cut by {S10}; PF-B30 (RV-D06), PF-C21 (RV-G21), PF-E17 "
        f"(RV-F09), PF-E19 (RV-G05), PF-S18 (RV-M06), PF-W28 (RV-C08), PF-X44 (RV-C06) and PF-Y04 (RV-C13) lost their "
        f"dated stories by {S11}; PF-E18 (RV-G09) reads \"the actual child in this class\", the lead's reading of his "
        f"words on this list (24 September, \"I actually don't know why it says nine-year-old\"), not his wording.",
    ],
    "2026-09-23-starters-sticky-apply-ledger.md": [
        f"- **SA-M08**'s pin holds the reviewer's section 3 list whole; it followed two sentences {REL} changed there: "
        f"a restating Do now goes back to the Lesson Designer ({D2}; RV-J34), and \"now\" left the `unlocks` line "
        f"(RV-J18). The test-question line this list changed is untouched.",
    ],
}

for name, lines in NOTES.items():
    path = PLANS / name
    text = path.read_text(encoding="utf-8")
    assert HEAD not in text, name
    text = text.replace("\r\n", "\n")
    path.write_text(text.rstrip("\n") + "\n\n" + HEAD + "\n\n" + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print("recorded in", name)
