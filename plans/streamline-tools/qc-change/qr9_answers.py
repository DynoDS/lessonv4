"""4.2.286: the teacher's answers of 23 September 2026 to the three open
quick-check questions ("4. agree 5. agree 6. rewrite")."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")

# Every replacement is (file, old, new), each old appearing exactly once.
EDITS = [
    # Answer 4: a label-reading check is on a map the lesson has not shown.
    ("references/task-contrasts.md",
     "and a quick label-reading check after a new map skill is an honest recall beat.",
     "and a quick label-reading check after a new map skill, on a map the lesson has not shown, is an honest check."),
    # Answer 5: the history contrast names the simpler task that is right.
    ("references/task-contrasts.md",
     "**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.",
     "**Where the simpler task is right.** Straight after the lesson teaches that a Tudor child's work gave the family something it needed, a quick match of jobs the slide did not show (`carried water`, `minded the pigs`) to what each gave the family is the right check: it needs that idea and nothing more. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks."),
    # Answer 6: each best-use line names the moment its limit allows.
    ("references/do-beats.md",
     "**Best for:** consolidating a single Teach chunk fast. Lower stakes than Brain Dump.",
     "**Best for:** choosing what mattered across several chunks, once the teaching is off the board. Lower stakes than Brain Dump."),
    ("references/do-beats.md",
     "**Best for:** after a content-rich Teach slide; works as the bridge into written response.",
     "**Best for:** retelling several chunks with the teaching off the board, later in the lesson or the unit; works as the bridge into written response."),
    ("references/do-beats.md",
     "**Best for:** end of a Teach chunk where there is a single core idea.",
     "**Best for:** the end of a run of chunks or a lesson, choosing the one idea that mattered most with the teaching off the board."),
    ("references/do-beats.md",
     "Pupils draw what was just described. *\"Sketch the water cycle as I described it. 90 seconds. Stick figures fine.\"*",
     "Pupils sketch from memory something taught earlier, with what the sketch must show named. *\"Sketch the water cycle from memory: the sea, a cloud, the rain and the arrows between them. 90 seconds. Stick figures fine.\"*"),
    ("references/do-beats.md",
     "**Best for:** end-of-chunk consolidation when content is conceptual.",
     "**Best for:** consolidating several conceptual chunks from memory, once the teaching is off the board."),
    ("references/do-beats.md",
     "**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.",
     "**Best for:** the end of a run of chunks, with the teaching off the board; bridge into the lesson's main Practise."),
    ("references/do-beats.md",
     "and as the check that a picture children copied actually means something to them. One sentence",
     "and, in a later lesson, as the check that a picture children copied actually means something to them. One sentence"),
]

texts: dict[str, str] = {}
for rel, old, new in EDITS:
    text = texts.setdefault(rel, (ROOT / rel).read_text(encoding="utf-8"))
    assert text.count(old) == 1, (rel, old[:80])
    texts[rel] = text.replace(old, new)
for rel, text in texts.items():
    (ROOT / rel).write_text(text, encoding="utf-8")
    print("patched", rel)
