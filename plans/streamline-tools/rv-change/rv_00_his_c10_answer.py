"""The design reviewer release, step 0: his answer on RV-C10, as the lead recorded
it in the design reviewer's ledger on 26 September (after the release's first
check), placed by a script so that a replay on a clean 4.2.292 tree makes the
same ledger. The words are the lead's record, copied here unchanged; this script
only puts them back in their place, after the "Settled items 5 to 11" answer in
"His answers, 24 September (afternoon)".

His answer: asked, with "Look at the diagram." as the example, whether the
reviewer rewrites a Teach example written as an instruction to look itself, as
what children will notice ("Notice the enamel is the hardest layer."), he said
"yes". So C10 stays the reviewer's wording fix; J34 and M14 still go to the
lesson designer."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
LEDGER = REPO / "plans" / "2026-09-23-design-reviewer-ledger.md"
print(f"writing into {LEDGER}")

AFTER = ("- **Settled items 5 to 11 (his c to h): yes** (his \"8C.\" read as yes to c). He asked\n"
         "  what the change log is; answered (the build review log).\n")
ENTRY = ("- **A Teach example written as an instruction to look (RV-C10; from the reviewer\n"
         "  release's first check, 26 September):** the release first sent it to the lesson\n"
         "  designer. The check found his words keep a wording fix with the reviewer (\"if it's a\n"
         "  small thing, say it's words aren't right and it thinks these words would be better,\n"
         "  then the reviewer changes them\"; his later \"y\" named only the picture swap and the\n"
         "  Do rewrite for the designer). Asked, with the example \"Look at the diagram.\",\n"
         "  whether the reviewer rewrites it itself as what children will notice (\"Notice the\n"
         "  enamel is the hardest layer.\"), he answered \"yes\". C10 stays the reviewer's.\n")

text = LEDGER.read_text(encoding="utf-8")
assert "\r\n" not in text
assert ENTRY not in text, "his answer is already recorded"
assert text.count(AFTER) == 1
LEDGER.write_text(text.replace(AFTER, AFTER + ENTRY), encoding="utf-8", newline="\n")
print("his C10 answer placed")
