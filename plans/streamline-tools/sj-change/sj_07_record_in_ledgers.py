"""The subject-files release (topic 8, release 1), step 7: each earlier topic
whose pins this release moved or retired records it in its own ledger (change
plan section 2: "Each is retired in its pin file with the decision recorded in
its own ledger"). One short section at the end of each ledger, in prose, so the
ledger's own row pattern (which the pin tests read) is untouched.

Not here: the playbook ledger's PB-V20 (the setup guide's "writing a subject
file" clause) and PB-B21 (the skill's test-run line, which went with the skill).
That ledger is untracked in the main checkout and not on this branch; the
release report asks the lead to record both there at merge."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLANS = REPO / "plans"
print(f"plans: {PLANS}")

HEAD = "## After the subject-files release (topic 8, release 1, 25 September 2026)"
REMOVED = ("his decisions 1 and 3 on the subject-files list (24 September): the make-subject-file skill and its "
           "writing guide are removed completely (\"just remove it completely\")")

NOTES = {
    "2026-09-22-assumed-knowledge-ledger.md": [
        f"- **AK-C03** is retired in `assumed_knowledge_ledger_pins.json`: its words lived in the skill, removed by "
        f"{REMOVED}. The pin now holds the file staying gone. The same words were the vocabulary list's VOC-M15.",
        "- **AK-B37** moved with the history file's words: \"the user chose on 14 September 2026\" is now \"the user "
        "chose\" (that list's settled item 10: the dates beside his examples go; the log holds the date).",
    ],
    "2026-09-23-success-criteria-ledger.md": [
        f"- **SC-C15** (the writing guide) and **SC-C16** (the skill) are retired in "
        f"`success_criteria_ledger_pins.json`: {REMOVED}. Each pin now holds its file staying gone.",
        "- **SC-G02** is retired: his decision 6 on that list (\"those balanced diet things sound like things I "
        "wouldnt want in the pshe subject files\", then \"maybe the subject file could say to look for guidance from "
        "eatwell guide thing\") took the per-meal quota rule out of the PSHE file, whose food section is now one line "
        "pointing to the NHS Eatwell Guide. The general rule, a count in a criterion is never invented (SC-G01), "
        "stays where every lesson reads it.",
    ],
    "2026-09-22-teach-then-do-ledger.md": [
        f"- **TD-A14** is retired in `teach_then_do_ledger_pins.json`: its words lived in the skill, removed by "
        f"{REMOVED}. The pin now holds the file staying gone.",
        "- **TD-K09** moved with the history file's words: the sketch's introducing sentence lost only \"(4 September "
        "2026)\" (that list's settled item 10); the sketch is unchanged.",
        "- **TD-A13** moved with the lesson designer's reading list: its subject-file line gained what history's and "
        "geography's word-for-word start notes carried (that list's settled item 12), and the paragraph is pinned "
        "again whole.",
    ],
    "2026-09-22-vocabulary-ledger.md": [
        f"- **VOC-M15** is retired in `vocabulary_ledger_pins.json`: its words lived in the skill, removed by "
        f"{REMOVED}. The pin now holds the file staying gone (the vocabulary test learned that pin in the same "
        "release).",
    ],
}

for name, lines in NOTES.items():
    path = PLANS / name
    text = path.read_text(encoding="utf-8")
    assert HEAD not in text, name
    assert "\r\n" not in text
    path.write_text(text.rstrip("\n") + "\n\n" + HEAD + "\n\n" + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print("recorded in", name)
