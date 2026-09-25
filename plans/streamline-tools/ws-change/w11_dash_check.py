"""The worksheets release (4.2.290): every paragraph this release rewrote or
added carries no em or en dash (change plan section 5: "Any paragraph this
release rewrites loses its em and en dashes"; paragraphs only moved or left
are not re-punctuated). Compares each changed file's paragraphs with 4.2.289
and prints any new or changed paragraph that still holds one.

    python -X utf8 plans/streamline-tools/ws-change/w11_dash_check.py
"""
import subprocess

from _patch import ROOT

REPO = ROOT.parents[1]
changed = subprocess.run(["git", "diff", "--name-only", "2db3ceba", "--", "plugins/lesson-v4"], cwd=REPO,
                         capture_output=True, text=True, check=True).stdout.split()
# One known block: the brief-gap protocol's "How to apply" item 2 is a single
# paragraph of bullets, one per designer. This release rewrote only the
# worksheet designer's bullet (settled item d), which has no dash; the slide
# designer's two bullets beside it keep theirs, because they were not rewritten
# and a success-criteria pin (SC-I19) holds one of them word for word.
KNOWN = {
    ("plugins/lesson-v4/references/brief-gap-protocol.md", "2. **Render the closest faithful version that respects your artefact's rules.**"),
    # The sheet table gained one row (`recordingLookedAgain`); the dash is in
    # the `layout` row, which this release did not write.
    ("plugins/lesson-v4/references/worksheet-helpers.md", "| Field | | |---|---| | `layout` |"),
    # A test that quotes the designer's own return line exactly as the designer
    # file prints it, dash included (the first check asked for that).
    ("plugins/lesson-v4/worksheet-html/test/directed-sheets.test.js", "test(\"the designer's own return line stands under an unavailable picture stage\""),
}
faults = 0
for rel in changed:
    if not rel.endswith((".md", ".js", ".py")):
        continue
    before = subprocess.run(["git", "show", f"2db3ceba:{rel}"], cwd=REPO, capture_output=True, text=True,
                            encoding="utf-8").stdout.replace("\r\n", "\n")
    path = REPO / rel
    if not path.exists():
        continue
    after = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    old = {" ".join(p.split()) for p in before.split("\n\n")}
    for para in after.split("\n\n"):
        flat = " ".join(para.split())
        if flat and flat not in old and ("—" in flat or "–" in flat):
            if rel.endswith(".json") or any(rel == k and flat.startswith(o) for k, o in KNOWN):
                continue
            faults += 1
            print(f"{rel}: {flat[:160]}")
print(f"DASH_CHECK {'OK' if not faults else 'FOUND ' + str(faults)}")
