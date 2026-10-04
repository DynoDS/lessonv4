"""The voice guide release: every paragraph this release and the routes release
both touch, for the merge.

    python -X utf8 vg_15_shared_paragraphs.py [routes-commit]

The routes release is main's commit `8af6f8a9` (4.2.295), on top of `379e09b0`;
this release is this branch's files against `91687471`. For each file both
change, splits the texts into paragraphs and lists each paragraph of the common
text that both changed, then the headings under which both changed paragraphs.
Writes nothing."""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ROUTES = sys.argv[1] if len(sys.argv) > 1 else "8af6f8a9"
HEADING = re.compile(r"^#{1,6} ")


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True, encoding="utf-8",
                          check=True).stdout


def paragraphs(text):
    out, heading = [], ""
    for block in text.replace("\r\n", "\n").split("\n\n"):
        first = block.strip().split("\n")[0] if block.strip() else ""
        if HEADING.match(first):
            heading = first
        out.append((heading, " ".join(block.split())))
    return out


voice = set(git("diff", "--name-only", "91687471", "--", "plugins/lesson-v4").split())
voice |= set(git("ls-files", "--others", "--exclude-standard", "plugins/lesson-v4").split())
routes = set(git("diff", "--name-only", f"{ROUTES}~1", ROUTES, "--", "plugins/lesson-v4").split())
for rel in sorted(voice & routes):
    if not rel.endswith(".md"):
        print(f"{rel}: not prose; see the trial merge")
        continue
    base = paragraphs(git("show", f"91687471:{rel}"))
    mine = {p for _h, p in paragraphs((REPO / rel).read_text(encoding="utf-8"))}
    theirs = {p for _h, p in paragraphs(git("show", f"{ROUTES}:{rel}"))}
    theirs_base = {p for _h, p in paragraphs(git("show", f"{ROUTES}~1:{rel}"))}
    touched_mine = [(h, p) for h, p in base if p not in mine]
    touched_theirs = [(h, p) for h, p in base if p in theirs_base and p not in theirs]
    same = [(h, p) for h, p in touched_mine if (h, p) in touched_theirs]
    near = sorted({h for h, _p in touched_mine} & {h for h, _p in touched_theirs})
    print(f"\n{rel}: this release changes {len(touched_mine)} paragraph(s), the routes release {len(touched_theirs)}")
    for h, p in same:
        print(f"  BOTH change the paragraph under {h!r}: {p[:140]}")
    for h in near:
        print(f"  both change paragraphs under {h!r}")
