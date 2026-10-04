"""The voice guide release, step 0: his answer of 26 September on the week 3
notes, recorded in the voice ledger's "Decisions taken" (after "His answers, 24
September (afternoon)"), so a replay on a clean tree makes the same ledger. The
lead put the question to him after the release's first check; his words are
quoted as the lead relayed them. `vg_02_guide.py` builds what he said.

Inserted before "### Settled without a question" rather than at the ledger's
end, where the routes release also appends, so the merge does not meet it."""
from _patch import PLANS

LEDGER = PLANS / "2026-09-23-teacher-voice-ledger.md"
ANCHOR = "### Settled without a question\n"
ENTRY = (
    "### His week 3 notes, and a phrase repeated for rhythm (26 September)\n"
    "\n"
    "Shown the four points the release took from his tooth-decay notes (the length is the idea's; each note picks up "
    "where the last left off; it talks to the children about themselves; it asks and answers, so the class thinks "
    "along) and asked whether repeating a phrase for rhythm, as those notes do (\"a tiny bit ... a tiny bit more\"), "
    "is fine in speaker notes, with the guide's warning against repeated phrases staying for what is written on a "
    "slide, he answered:\n"
    "\n"
    "> yes thats fine\n"
    "\n"
    "Read back: the four points stand; in speaker notes a phrase said again for rhythm is how speech builds, and the "
    "guide's warning against sentences of one repeated shape is for the written board and page.\n"
    "\n"
)
print(f"writing into {LEDGER}")
text = LEDGER.read_text(encoding="utf-8")
assert "\r\n" not in text
assert "His week 3 notes, and a phrase repeated for rhythm" not in text
assert text.count(ANCHOR) == 1
LEDGER.write_text(text.replace(ANCHOR, ENTRY + ANCHOR), encoding="utf-8", newline="\n")
print("HIS_RHYTHM_ANSWER_OK")
