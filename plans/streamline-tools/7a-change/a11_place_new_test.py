"""Release 7A (4.2.293), step 11: the new pin test is placed from `new/` (it was
written there and in the plugin together; this script is what a replay on a
clean 4.2.292 tree runs). The pin file itself is written by
`build_7a_mapping.py`."""
import shutil
from pathlib import Path

from _patch import ROOT

HERE = Path(__file__).resolve().parent
NAME = "test_starters_sticky_apply_ledger_is_kept.py"
target = ROOT / "scripts" / "tests" / NAME
assert not target.exists(), f"{target} is already there"
shutil.copyfile(HERE / "new" / NAME, target)
print("new pin test placed")
