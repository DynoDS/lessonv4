"""The worksheets release (4.2.290), step 8b: rebuild the two references the
engine generates, and prove only the intended lines changed.

`references/worksheet-helpers/catalogue.md` (from `build-catalogue.js`) and
`references/worksheet-compositions.md` (from `build-layouts-doc.js`) change
only through their generators. This runs `npm run catalogue` and
`npm run layouts`, then compares each file with its 4.2.289 version line by
line (whitespace runs as one space, line endings ignored) and fails unless the
only differences are the lines w7 changed in the generators."""
import subprocess
from pathlib import Path

from _patch import ROOT

REPO = ROOT.parents[1]
ENGINE = ROOT / "worksheet-html"
EXPECTED = {
    "references/worksheet-helpers/catalogue.md": {
        "removed": {
            "If a lesson needs something no helper here can express, say so in `notes` rather",
            "than bending the nearest one to fit. That is how the next helper gets built.",
        },
        "added": {
            "If a lesson needs something no helper here can express, return it as a gap (the",
            "worksheet designer's rule 11) rather than bending the nearest one to fit. That is",
            "how the next helper gets built.",
        },
    },
    "references/worksheet-compositions.md": {
        "removed": {
            "zones (6mm) and the band the learning objective and sheet code sit in",
            "are already taken off. So these are the millimetres a helper actually gets, and",
        },
        "added": {
            "zones (6mm) is already taken off, and the sheet code sits in the top",
            "margin, taking no room from the zones. So these are the millimetres a helper actually gets, and",
        },
        # The committed tables were generated while a 6mm band was still taken
        # off the page; `headerMm` has returned 0 since the title went, so every
        # table row's HEIGHTS move up and nothing else in a row may change.
        "tables": True,
    },
}
ROW = __import__("re").compile(r"^\| `([a-z])` \| (\d+) x (\d+) \| (\d+) x (\d+) \|$")

for script in ("catalogue", "layouts"):
    subprocess.run(["npm", "run", script], cwd=ENGINE, check=True, shell=True,
                   capture_output=True, text=True)


def lines_at_head(rel: str) -> list[str]:
    raw = subprocess.run(["git", "show", f"2db3ceba:plugins/lesson-v4/{rel}"], cwd=REPO, check=True,
                         capture_output=True, text=True, encoding="utf-8").stdout
    return [" ".join(line.split()) for line in raw.splitlines()]


for rel, want in EXPECTED.items():
    before = lines_at_head(rel)
    after = [" ".join(line.split()) for line in (ROOT / rel).read_text(encoding="utf-8").splitlines()]
    raw = (ROOT / rel).read_bytes()
    if not want.get("tables"):
        removed, added = set(before) - set(after), set(after) - set(before)
        assert removed == want["removed"], (rel, "removed", sorted(removed))
        assert added == want["added"], (rel, "added", sorted(added))
        assert len(after) - len(before) == len(want["added"]) - len(want["removed"]), (rel, len(before), len(after))
        print(f"{rel}: only the intended lines changed; CRLF={b'\r\n' in raw}")
        continue
    assert len(after) == len(before), (rel, len(before), len(after))
    rows_changed = 0
    prose_removed, prose_added = set(), set()
    for old, new in zip(before, after):
        if old == new:
            continue
        a, b = ROW.match(old), ROW.match(new)
        if want.get("tables") and a and b:
            # Same zone, same widths; only the heights may move, and only up.
            assert a.group(1) == b.group(1) and a.group(2) == b.group(2) and a.group(4) == b.group(4), (old, new)
            assert int(b.group(3)) >= int(a.group(3)) and int(b.group(5)) >= int(a.group(5)), (old, new)
            rows_changed += 1
            continue
        prose_removed.add(old)
        prose_added.add(new)
    assert prose_removed == want["removed"], (rel, "removed", sorted(prose_removed))
    assert prose_added == want["added"], (rel, "added", sorted(prose_added - want["added"]))
    raw = (ROOT / rel).read_bytes()
    print(f"{rel}: prose changed only where intended; {rows_changed} table rows had their heights corrected; CRLF={b'\r\n' in raw}")
print("REGENERATED_OK")
