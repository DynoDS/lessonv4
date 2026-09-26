"""Release 7A (4.2.293), step 8j's test through the route:
`scripts/tests/test_a_split_wall_arrives.py` (from `7a-change/new/`)."""
import shutil
from pathlib import Path

from _patch import ROOT

NEW = Path(__file__).resolve().parent / "new" / "test_a_split_wall_arrives.py"
shutil.copyfile(NEW, ROOT / "scripts" / "tests" / "test_a_split_wall_arrives.py")
print("the split wall test written")
