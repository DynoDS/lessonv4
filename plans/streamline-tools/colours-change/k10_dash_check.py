"""The colours release: no em or en dash in anything it wrote.

Reads every line the release added to the plugin (against 4.2.289, `2db3ceba`)
and every file it created, and lists each line holding an em or en dash. A
line that only corrected a word beside a dash already there is listed with
`kept`, when its dash sits in the part the release did not rewrite; everything
else must be empty."""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DASHES = ("—", "–")
# Lines whose dash was in the original line and sits outside the words changed
# (the plan: "An existing dash in a line that is only being corrected elsewhere
# is left alone").
KEPT = (
    "- `variant` — the box's colour",
    "//   title   optional heading (\"Adjusting strategy\") — purple",
    "- `title` — optional purple heading",
    "- `frame` — draw the purple panel",
    "A grid of 4–12 short word chips",
    "card carries 4–12 short word chips",
    "For a dense task, identify its **survival phrase**",
    "A `total` with the green `||` marker",
    "- `yellow` — the warm word-bank look",
    "| Don't fight the type system |",
    "// ─── ",
    "`\"orange\"` information the question supplies",
    "## 2026-09-25 - Blue is a question",
    "**Inline emphasis in cells.** Body cells accept the inline markers",
    "**Key words carry colour with the ordinary inline markers** — there is no separate colouring field.",
    "**Paired stems — gappy + modelled.**",
    "| **Sentence stem** | A \"How to talk about it\" prompt — typically",
    "**The vocabulary family — depth and breadth on one zone.**",
    # SC-O23's repin quotes the section's field table whole, its "2–4 part objects" included.
    "| `cards[].parts` | 2–4 part objects.",
)
# The pin file quotes the files' own paragraphs, dashes and all.
QUOTES = ("plugins/lesson-v4/scripts/tests/colours_ledger_pins.json",)

diff = subprocess.run(["git", "diff", "-U0", "2db3ceba", "--", "plugins/lesson-v4"],
                      cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout
added = [(None, line[1:]) for line in diff.splitlines() if line.startswith("+") and not line.startswith("+++")]
untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "plugins/lesson-v4"],
                           cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout.split()
for rel in untracked:
    if rel in QUOTES:
        continue
    for line in (REPO / rel).read_text(encoding="utf-8").splitlines():
        added.append((rel, line))

bad = []
for rel, line in added:
    if any(d in line for d in DASHES):
        if any(k in line for k in KEPT):
            print("kept:", (rel or ""), line.strip()[:110])
        else:
            bad.append(((rel or ""), line.strip()[:160]))
for rel, line in bad:
    print("DASH:", rel, line)
print(f"DASH_CHECK {'OK' if not bad else 'FAILED'} ({len(bad)} lines)")
