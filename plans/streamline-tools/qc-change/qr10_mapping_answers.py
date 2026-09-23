"""The mapping scripts follow the teacher's three answers."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ANSWERS = [
    ("a quick label-reading check after a new map skill is an honest recall beat.",
     "a quick label-reading check after a new map skill, on a map the lesson has not shown, is an honest check."),
    ("**Best for:** consolidating a single Teach chunk fast. Lower stakes than Brain Dump.",
     "**Best for:** choosing what mattered across several chunks, once the teaching is off the board. Lower stakes than Brain Dump."),
    ("**Best for:** after a content-rich Teach slide; works as the bridge into written response.",
     "**Best for:** retelling several chunks with the teaching off the board, later in the lesson or the unit; works as the bridge into written response."),
    ("**Best for:** end of a Teach chunk where there is a single core idea.",
     "**Best for:** the end of a run of chunks or a lesson, choosing the one idea that mattered most with the teaching off the board."),
    ("Pupils draw what was just described. *\\\"Sketch the water cycle as I described it. 90 seconds. Stick figures fine.\\\"*",
     "Pupils sketch from memory something taught earlier, with what the sketch must show named. *\\\"Sketch the water cycle from memory: the sea, a cloud, the rain and the arrows between them. 90 seconds. Stick figures fine.\\\"*"),
    ("**Best for:** end-of-chunk consolidation when content is conceptual.",
     "**Best for:** consolidating several conceptual chunks from memory, once the teaching is off the board."),
    ("**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.",
     "**Best for:** the end of a run of chunks, with the teaching off the board; bridge into the lesson's main Practise."),
    ("and as the check that a picture children copied actually means something to them.",
     "and, in a later lesson, as the check that a picture children copied actually means something to them."),
]


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, old[:90])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


lines = "".join(f"    ({old!r}, {new!r}),\n" for old, new in ANSWERS)
HISTORY_OLD = "**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks."
HISTORY_NEW = "**Where the simpler task is right.** Straight after the lesson teaches that a Tudor child's work gave the family something it needed, a quick match of jobs the slide did not show (`carried water`, `minded the pigs`) to what each gave the family is the right check: it needs that idea and nothing more. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks."
patch(HERE / "build_qc_mapping.py", [
    ("]\n\nAUTO = {", lines + "]\n\nAUTO = {"),
    # The rows whose quotes stand gained a line; their quotes now follow the answers too.
    ("        CHANGED[rid] = (outcome, [(path.group(1), q) for q in quotes] + extra, [])",
     "        replayed = []\n        for q in quotes:\n            for old, new in SWAPS:\n                q = q.replace(old, new)\n            replayed.append((path.group(1), q))\n        CHANGED[rid] = (outcome, replayed + extra, [])"),
    (HISTORY_OLD.replace("'", "\\'") if False else HISTORY_OLD, HISTORY_NEW),
])
patch(HERE.parent / "td-change" / "build_td_mapping.py", [(HISTORY_OLD, HISTORY_NEW)])
