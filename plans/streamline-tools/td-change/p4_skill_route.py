"""4.2.285: the skill route's cycle rules move above the line the reviewer
stops reading at, word for word (decision 6); stale wording is corrected
(decision 7); stories leave, plain examples stay."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\teaching-sequence-skill-based.md")
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# Decision 6: lift the block of cycle rules out of the Output Format Block.
first = "For each concept, use zero or more preparation units when genuinely needed, then **one or more cycles**."
last_end = "What to avoid is reaching for the reverse by reflex because a second example was wanted and undoing the first was the quickest one to write.\n"
start = text.index(first)
end = text.index(last_end) + len(last_end)
assert text.count(first) == 1 and text.count(last_end) == 1
block = text[start:end]
assert block.count("\n\n") == 11, block.count("\n\n")  # twelve paragraphs, moved whole
text = text[:start] + text[end:].lstrip("\n")
text = text.replace("\n\n\n", "\n\n")
anchor = "## Output Format Block\n"
assert text.count(anchor) == 1
text = text.replace(
    anchor,
    "## Cycles, and the beats around them\n\n" + block + "\n---\n\n" + anchor,
)

# Decision 7: the code refuses any two My Turn units in a row.
swap(
    "`validate-lesson-design.py` refuses two My Turn units in a row for the same concept, and the slide check",
    "`validate-lesson-design.py` refuses any two My Turn units in a row, and the slide check",
)
# Decision 7: a distinct move is its own unit and opens its own cycle.
swap(
    "In the structured hand-off, each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept, so it can carry",
    "In the structured hand-off, each genuinely distinct My Turn modelled move is its own `my-turn` source unit inside the same concept, opening its own cycle (its Our Turn and Your Turn come before the next move's My Turn, never two My Turns in a row), so it can carry",
)
# Decision 7: the pointer names the section that exists.
swap(
    "(see \"Picking the splitting axis\" earlier)",
    "(`lesson-designer.md` → Structure Decision, `Splitting axis when LO names multiple outputs`)",
)

# Stories leave for the build log; the reason and the plain examples stay.
swap(
    "leaves the first move a single demonstration away from independent work, and a Year 4 rounding lesson did exactly that: 43 and 45 were modelled, guided once on 48, and then not written by a child until a mixed set twenty minutes and two more moves later. So the Your Turn",
    "leaves the first move a single demonstration away from independent work. So the Your Turn",
)
swap(
    "Rounding 3,998 to the nearest 10 needs 3,990 and 4,000 before a number line can be drawn, and a Year 4 class that could round 43 could not find those two tens (17 September 2026): the deck went straight into rounding and left the step to a teacher who would notice, and a cover teacher did not. The repair taught the next day was a My Turn on two cases",
    "Rounding 3,998 to the nearest 10 needs 3,990 and 4,000 before a number line can be drawn, and a class that can round 43 may not be able to find those two tens: a deck that goes straight into rounding leaves the step to a teacher who would notice, and a cover teacher does not. The short cycle for it is a My Turn on two cases",
)
swap(
    "A Year 4 slide that set `43 children came to the fair` and `about 40 children` in two text cards around a small number line was the right idea and read as wordy (17 September 2026).",
    "A slide that sets `43 children came to the fair` and `about 40 children` in two text cards around a small number line is the right idea and reads as wordy.",
)

P.write_text(text, encoding="utf-8")
print("skill route patched")
