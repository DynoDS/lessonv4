"""The voice guide release (topic 8, release 5), after the merge: record in the two
lists not yet built the rows whose quoted words this release changed.

The rest-of-preferences list (7B's) and the routes list (release 3's) both gain
closing notes from the routes release, which merges first, so appending here on
the branch would conflict at each ledger's end. The lead runs this after the
merge (through `vg_09_follow_at_merge.py`); like `vg_07`, it appends only a
section a ledger does not hold yet. The mapping lists the same rows."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
print(f"plans: {PLANS}")

HEAD = "## After the voice guide release (topic 8, release 5, 26 September 2026)"
REL = ("the voice guide release (topic 8, release 5), on the voice guide's list "
       "(`2026-09-23-teacher-voice-ledger.md`), whose mapping is `2026-09-26-teacher-voice-mapping.md`")
DASH = ("its settled item 8: a long dash in an example a child could be given is replaced, because the teacher does "
        "not write one")

NOTES = {
    "2026-09-23-preferences-rest-ledger.md": [
        f"These rows quote lines {REL} changed. 7B reads them as they now stand; none of them is pinned yet.",
        "- **The voice guide:** PF-A31 (the reading route gains §7 and §14, the voice list's decision 1), PF-B19 (\"Treat "
        "this guide as the default runtime specification.\" moved into the Purpose paragraph from the Maintenance note, "
        "which went to the voice harness's read-me), PF-C27 and PF-W24 (his two rulings lost their dates, his words "
        "kept), PF-C55 (the RE slide is one plain telling, not an incident), PF-D79 (the em dash left the \"avoid "
        "unless\" list for a line that says never), PF-O55 (the three prompts that reached children left for the build "
        "log; the route names four most-missed kinds), PF-U34 (the staging note names both teacher lines).",
        "- **Preferences:** PF-C04 (\"not the other way round\" is now \"not normally the other way round\", the voice "
        "list's settled item 5), PF-P01 (the case-context paragraph gains \"Before the case means before the question "
        "about it: when the thing is on the board, the sentence about the thing in view comes first and the general "
        "one straight after.\", its decision 2), PF-U01 (the notes hand-off names the two full-length scripts in "
        "§16H, and gains his words beside \"chosen for the idea rather than a mechanical simplicity rule\": \"speaker "
        f"notes are as long as the idea needs, of course, and they're also conversational\"), PF-P03 and PF-V08 ({DASH}).",
        "- **The lesson designer:** PF-B09 (\"never the reverse\" is \"not normally the reverse\"), PF-N29 (an invented "
        "group gets a name, not always a class code like `Class 4B`: `Oak Class`, `the class at Hilltop School`, his "
        "decision 11 there), PF-U07 (the notes voice: \"as long as the idea needs and conversational, in words the "
        "children in this class follow (the teacher: \"it doesn't have to be short sentences\")\", this list's decision "
        "3, his 1).",
        "- **The adaptation files:** PF-D49 (the adaptation designer's vocabulary sentence points at Written Voice's "
        "Below paragraph) and PF-D50 (the adaptation reference's plain repeat is cut), the voice list's settled item 6; "
        "PF-C71 (Greater Depth wording \"is still met by a child in this class reading it alone\") and PF-N82 (its "
        "example names the child, `Is Asha right about all of it?`, this list's settled item 14).",
        f"- **The routes:** PF-F60 and PF-V15 ({DASH}).",
        "- **No longer 7B's:** the lead brought into the voice guide release, after its first check, the lesson "
        "designer's notes voice line and the hand-off's gain of his words (this list's decision 3, his 1: \"for the "
        "speaker notes it doesn't have to be short sentences\"), and the voice list's decision 13 (each line that fixed "
        "a nine-year-old reader now says a child in this class: preferences' sort groups and own-question test, the "
        "adaptation designer's Greater Depth line), with PF-N82 in the same edit, in 7B's planned words, so the "
        "designer and the guide no longer pull against each other. Still 7B's from B1: the hand-off naming the notes' "
        "lines in the order they print (settled item 3); and L57's date.",
    ],
    "2026-09-23-routes-ledger.md": [
        f"These rows quote lines {REL} changed ({DASH}): RT-A43 (the research file's red flag, \"here are the seven "
        "kinds of influence - copy them down\"), RT-F16 (the task route's \"your research: most of the lesson\") and "
        "RT-G07 (the dialogic route's \"you're [character], what would you say?\"). The dialogic route's discussion "
        "notes (RT-G09) keep every word and gain one sentence, \"The discussion itself is not scripted; the words that "
        "open and frame it are.\" (the voice list's decision 12). The routes release's pins that held the old words "
        "followed them (`vg_06_repin_other_topics.py`).",
    ],
}

for name, notes in NOTES.items():
    path = PLANS / name
    text = path.read_text(encoding="utf-8")
    assert "\r\n" not in text, name
    section = HEAD + "\n\n" + "\n".join(notes) + "\n"
    if HEAD in text:
        assert section in text or text.rstrip("\n").endswith(section.rstrip("\n")), f"{name}: a different section"
        print(f"already recorded: {name}")
        continue
    path.write_text(text.rstrip("\n") + "\n\n" + section, encoding="utf-8", newline="\n")
    print(f"recorded: {name}")
print("RECORD_AFTER_MERGE_OK")
