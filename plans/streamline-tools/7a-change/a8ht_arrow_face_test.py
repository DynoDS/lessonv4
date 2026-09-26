"""Release 7A (4.2.293), step 8h's test: `every-arrow-is-drawn-from-the-wall-arrows.test.js`
(from `7a-change/new/`) holds every place the wall writes words to the wall's
arrow face, and the arrow to the digits' weight within the line."""
import shutil
from pathlib import Path

from _patch import ROOT

NEW = Path(__file__).resolve().parent / "new" / "every-arrow-is-drawn-from-the-wall-arrows.test.js"
shutil.copyfile(NEW, ROOT / "working-wall-html" / "test" / "every-arrow-is-drawn-from-the-wall-arrows.test.js")
print("the arrow face test written")
