"""Release 7A (4.2.293), step 8f's test: a standing Chrome guard.

`working-wall-html/test/no-card-prints-outside-its-box.test.js` (from
`7a-change/new/`) builds every one of the engine's A3 fixtures, a diagram
section (the saved "Counting through zero", which no fixture holds) and every
saved wall beside the plugin in this checkout, prints each page in Chrome, and
fails if any line of text lies outside the nearest drawn box around it or the
page, and unless the fixtures and the section draw every card type build.js
has. A saved wall the build refuses draws nothing and is skipped."""
import shutil
from pathlib import Path

from _patch import ROOT

NEW = Path(__file__).resolve().parent / "new" / "no-card-prints-outside-its-box.test.js"
shutil.copyfile(NEW, ROOT / "working-wall-html" / "test" / "no-card-prints-outside-its-box.test.js")
print("the standing guard written")
