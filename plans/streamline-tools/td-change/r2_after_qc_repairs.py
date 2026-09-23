"""The Teach then Do mapping follows the 4.2.286 repairs, and says which of its
rows' paragraphs the quick-checks change also touched."""
from pathlib import Path

p = Path(__file__).with_name("build_td_mapping.py")
t = p.read_text(encoding="utf-8")
HOME = "`A quick check is a fresh case, not the last slide again`"
BOTH = "a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case"


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:90]
    t = t.replace(old, new)


swap('"stay legitimate choices rather than failures to aim higher (a quick check on a fresh case, or recall with the answer off the board: `A quick check is a fresh case, not the last slide again`)."',
     f'"stay legitimate choices rather than failures to aim higher ({HOME}: {BOTH})."')
swap('"A short response can establish new knowledge, when its answer is not on the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); select"',
     f'"A short response can establish new knowledge (`preferences.md` → {HOME}: {BOTH}); select"')
swap('"including the last short response before main practice (recall with the answer off the board, or a fresh case: `A quick check is a fresh case, not the last slide again`)."',
     f'"including the last short response before main practice ({HOME}: {BOTH})."')
swap('"Preserve purposeful repeated practice and useful simple checks (a fresh case, or recall with the answer off the board: `preferences.md` → `A quick check is a fresh case, not the last slide again`);"',
     f'"Preserve purposeful repeated practice and useful simple checks (`preferences.md` → {HOME}: {BOTH});"')
swap('"Accurate classification may itself be the intended check, on cards the Teach did not show (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not"',
     f'"Accurate classification may itself be the intended check (`preferences.md` → {HOME}: the cards are cases the Teach did not show); do not"')
swap('(LD, "A short recall response may secure new knowledge, including in the last Do, when the answer is no longer on show (`preferences.md` → `A quick check is a fresh case, not the last slide again`). Read what children actually do; do not label recall as reasoning or force each response to be harder.")],',
     f'(LD, "A short recall response may secure new knowledge, including in the last Do (`preferences.md` → {HOME}: {BOTH}). Read what children actually do; do not label recall as reasoning or force each response to be harder.")],')
swap("""    "retired by name (quick checks 4.2.286, decisions 1 and 2): the simpler task is right on cases the lesson did not show, and the sort of the deal just taught is not the lesson's evidence",
    [("references/task-contrasts.md", "A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],""",
     """    "retired by name (quick checks 4.2.286, decisions 1 and 2): the sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks",
    [("references/task-contrasts.md", "**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.")],""")
# Rows whose whole-paragraph pins now carry quick-check edits made beside them.
for rid, note in (
    ("TD-E04", "; its paragraph also holds the quick-checks home, changed in 4.2.286"),
    ("TD-E05", "; its paragraph's recall line points home since quick checks 4.2.286 (decision 4)"),
    ("TD-F13", "; its recall line points home since quick checks 4.2.286 (decision 4)"),
    ("TD-L07", "; the reviewer's check list it sits in carries quick checks 4.2.286's pointer (decision 4)"),
    ("TD-M04", "; its paragraph's walk example became a plain example in quick checks 4.2.286"),
):
    marker = f'    "{rid}": ('
    i = t.index(marker) + len(marker)
    q = t.index('",', i)
    t = t[:q] + note + t[q:]
p.write_text(t, encoding="utf-8")
print("td mapping follows the repairs")
